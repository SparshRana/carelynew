'use client';
import {useEffect,type ReactNode} from 'react';
/** Ignore old saved dark preferences without modifying anyone's cabinet data. */
export function ThemeProvider({children}:{children:ReactNode}){useEffect(()=>{document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light';},[]);return children;}
