const express = require ('express');
const cors = require ('cors');
const mongoose = require ('mongoose');
const User = require ('./models/User');

const bcrypt = require ('bcryptjs');
const jwt = require ('jsonwebtoken');
const Iyzipay = require('iyzipay');

const cookieParser = require ('cookie-parser');
const sesion = require ('express-session');
const app = express ();
require ('dotenv').config ();

const salt = bcrypt.genSaltSync(10);
const secret = process.env.SECRET;

const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:3030'],
    credentials: true,
    methods: 'GET, POST, PUT, DELETE, OPTIONS',
    allowedHeaders: 'Content-Type, Authorization'
};

app.use (cors (corsOptions));
app.use (express.json ());
app.use (cookieParser ());

app.use (sesion ({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true
}));

const iyzipay = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    uri: 'https://sandbox-api.iyzipay.com'
});

mongoose.connect (process.env.MONGODB_URL)
.then (() => { console.log ('Connected to MongoDB') })
.catch ((e) => { console.error ('Error connecting to MongoDB:', e) });

//? Register & Login
app.post ('/register', async (req, res) => {
    const {email, username, password} = req.body;
    try {
        const userDoc = await User.create({
            email,
            username,
            password:bcrypt.hashSync(password, salt),
            role: 'guest',
            premiumExpiration: Date.now(),
            isBanned: false,
            createdAt: Date.now(),            
        })
        res.json(userDoc);
    } catch (e) {
        res.status(400).json(e);
    }
});

app.post ('/login', async (req, res) => {
    const {username, password} = req.body;
    const userDoc = await User.findOne({username});
    if (!userDoc) {
        return res.redirect('/login');
    }
    const  passOk = bcrypt.compareSync(password, userDoc.password);
    if(passOk){
        jwt.sign(
            {
                email:userDoc.email, 
                username:userDoc.username, 
                role:userDoc.role, 
                premiumExpiration:userDoc.premiumExpiration, 
                isBanned:userDoc.isBanned, 
                id:userDoc._id
            }, secret, {} , (err, token) => {
            if (err) {
                console.error('Token oluşturulamadı:', err);
                return res.status(500).json({ error: 'Token oluşturulamadı' });
            }

            res.cookie('token', token,{
                    sameSite: "none", 
                    maxAge: 24 * 60 * 60 * 1000, 
                    httpOnly: false, 
                    secure: true
                }).json({
                    id:userDoc._id,
                    username:userDoc.username,
                    role:userDoc.role,
                    email:userDoc.email,
            });
            console.log('Logged in, Token olusturuldu.', token);
        });
    }else{
        res.status(400).json({message: 'Wrong password'});
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.clearCookie('token').json({message: 'Logged out from all devices'});
    res.cookie('token', '', {
        sameSite: "none",
        maxAge: 0,
        httpOnly: false,
        secure: true
    });
});

//? Profile
// app.get('/profile', (req, res) => {
app.get('/profile', (req, res) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            return res.status(400).json({ message: 'No token found' });
        }

        jwt.verify(token, secret, (err, info) => {
            if (err) {
                return res.clearCookie('token').status(401).json({ message: 'Unauthorized' });
            }
            
            res.json(info);
            console.log('Profile info:', info);
        });
    } catch (e) {
        res.status(400).json(e);
    }
});

app.get('/updatedProfile', async (req, res) => {
    const { token } = req.cookies;
    if (!token) {
        return res.status(400).json({ message: 'No token found' });
    }

    jwt.verify(token, secret, async (err, info) => {
        if (err) {
            return res.clearCookie('token').status(401).json({ message: 'Unauthorized' });
        }

        const userDoc = await User.findById(info.id);
        res.json(userDoc);
        console.log('Updated Profile info:', userDoc);
    });
});

app.get('/profile/:username', async (req, res) => {
    const {username} = req.params;
    const userDoc = await User.findOne ({username});
    res.json(userDoc);
});


//? Payment

app.post('/payment', async (req, res) => {
    const { userId, price, paymentCard } = req.body;

    console.log("Gelen Ödeme Talebi:", req.body); // Bu satır eklendi

    if (!paymentCard) {
        return res.status(400).json({ message: 'PaymentCard bilgisi eksik' });
    }

    try {
        const paymentRequest = {
            locale: Iyzipay.LOCALE.TR,
            conversationId: userId,
            price: price,
            paidPrice: price,
            currency: Iyzipay.CURRENCY.TRY,
            installment: 1,
            basketId: 'B67832',
            paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
            paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
            callbackUrl: 'http://localhost:3030/payment/callback',
            buyer: {
                id: userId,
                name: 'Kullanıcı',
                surname: 'Adı',
                email: 'kullanici@example.com',
                identityNumber: '11111111111',
                registrationAddress: 'Adres',
                city: 'Şehir',
                country: 'Türkiye',
                zipCode: '34732',
            },
            shippingAddress: {
                contactName: 'Kullanıcı Adı',
                city: 'Şehir',
                country: 'Türkiye',
                address: 'Adres',
                zipCode: '34732',
            },
            billingAddress: {
                contactName: 'Kullanıcı Adı',
                city: 'Şehir',
                country: 'Türkiye',
                address: 'Adres',
                zipCode: '34732',
            },
            basketItems: [
                {
                    id: 'BI101',
                    name: 'Premium Üyelik',
                    category1: 'Üyelik',
                    itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
                    price: price,
                },
            ],
            paymentCard, // Bu alan eklendi
        };

        iyzipay.payment.create(paymentRequest, async (err, result) => {
            if (err || result.status !== 'success') {
                console.error("Ödeme Hatası:", err || result);
                return res.status(400).json({ message: 'Ödeme başarısız', error: err || result });
            }

            // Kullanıcıyı premium yap
            const premiumExpiration = new Date();
            premiumExpiration.setMonth(premiumExpiration.getMonth() + 1);
            await User.findByIdAndUpdate(userId, { role: 'premium', premiumExpiration });

            res.status(200).json({ message: 'Ödeme başarılı, Premium aktif edildi', result });
        });
    } catch (error) {
        console.error("Sunucu Hatası:", error);
        res.status(500).json({ message: 'Bir hata oluştu', error });
    }
});



//! Listen to port 3030
app.listen(3030, () => {
    console.log('Server listening on port 3030 || nodemon index.js')
});