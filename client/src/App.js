import './App.css';
import { UserContextProvider } from './Hooks/UserContext';
import AppRouter from './Routes/AppRouter';

function App() {
  return (
    <UserContextProvider>
      <div className="App">
        <AppRouter />
      </div>
    </UserContextProvider>
  );
}

export default App;