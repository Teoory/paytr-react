import React, { useContext, useEffect } from "react";
import { UserContext } from "../Hooks/UserContext";
import { Link } from "react-router-dom";
import { API_BASE_URL } from '../config';

const Home = () => {
  const { setUserInfo, userInfo } = useContext(UserContext);

  useEffect(() => {
    fetch(`${API_BASE_URL}/updatedProfile`, {
        credentials: 'include',
    }).then(response => {
        if (!response.ok) {
          setUserInfo(null);
          return;
        }
        return response.json();
      })
      .then(userInfo => {
        setUserInfo(userInfo);
      })
      .catch((err) => {
        setUserInfo(null);
        console.error("Kullanıcı bilgileri alınamadı: ", err);
      });
  }, [setUserInfo]);

  if (!userInfo) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h2>Lütfen giriş yapınız.</h2>
        <Link
          to="/login"
          style={{
            color: "#fff",
            backgroundColor: "#007bff",
            padding: "10px 20px",
            borderRadius: "5px",
            textDecoration: "none",
          }}
        >
          Giriş Yap
        </Link>
      </div>
    );
  }

  const { email, username, role } = userInfo;

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h1>Hoşgeldiniz!</h1>

      <div
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "5px",
          marginBottom: "20px",
          backgroundColor: "#f9f9f9",
        }}
      >
        <h2>Kullanıcı Bilgileri</h2>
        <p>
          <strong>Email:</strong> {email}
        </p>
        <p>
          <strong>Kullanıcı Adı:</strong> {username}
        </p>
        <p>
          <strong>Rol:</strong> {role}
        </p>
      </div>

      {role === "guest" && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <h3>Premium Üyelik</h3>
          <p>Premium üyelik avantajlarından yararlanmak için şimdi yükseltin.</p>
          <Link
            to="/payment"
            style={{
              color: "#fff",
              backgroundColor: "#4caf50",
              padding: "10px 20px",
              borderRadius: "5px",
              textDecoration: "none",
            }}
          >
            Premium Ol
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;