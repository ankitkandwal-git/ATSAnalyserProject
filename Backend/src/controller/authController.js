import { User } from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const register = async(req,res) =>{
    const {name,email,password} = req.body;
    try{
        if(!name || !email || !password){
            return res.status(400).json({error: 'All fields are required'});
        }
        
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(409).json({error: 'Email already registered'});
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword
        });
        
        const token = jwt.sign({userId: newUser._id}, process.env.JWT_SECRET || 'secret_key');
        
        res.status(201).json({
            token,
            name: newUser.name,
            email: newUser.email
        });
    }catch(err){
        console.error('Registration error:', err);
        res.status(500).json({error: err.message});
    }
}

export const login = async(req,res) =>{
    const {email,password} = req.body;
    try{
        if(!email || !password){
            return res.status(400).json({error: 'Email and password are required'});
        }
        
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({error: 'Invalid email or password'});
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            return res.status(401).json({error: 'Invalid email or password'});
        }
        
        const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET || 'secret_key');
        
        res.status(200).json({
            token,
            name: user.name,
            email: user.email
        });
    }catch(err){
        console.error('Login error:', err);
        res.status(500).json({error: err.message});
    }
}