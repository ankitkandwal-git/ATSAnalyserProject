import {BrowserRouter , Routes, Route} from 'react-router-dom';
import Register from './Components/Auth/register';
import Login from './Components/Auth/login';
import Dashboard from './Components/Dashboard/dashboard';
import './App.css';

const App = () =>{
  return(
     <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/register' element={<Register/>}/>
        <Route path='/dashboard' element={<Dashboard/>}/>
      </Routes>
     </BrowserRouter>
  )
}
export default App;