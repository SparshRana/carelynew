'use client';
import {createContext,useContext,type ReactNode} from 'react';
import {translate} from '@/lib/hi';
const LanguageContext=createContext(false);
export function LanguageProvider({hindi,children}:{hindi:boolean;children:ReactNode}){return <LanguageContext.Provider value={hindi}>{children}</LanguageContext.Provider>;}
export function useI18n(){const hindi=useContext(LanguageContext);return {hindi,t:(text:string)=>hindi?translate(text):text};}
