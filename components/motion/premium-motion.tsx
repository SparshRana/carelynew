'use client';
import {useEffect} from 'react';
import {attachCardMotion} from '@/lib/card-motion';
/** Keep the cabinet's existing card interaction; the new layered scenes replace global capsules. */
export default function PremiumMotion({paused=false}:{paused?:boolean}){
 useEffect(()=>attachCardMotion(document.querySelector('.site')||document.body),[]);
 useEffect(()=>{document.querySelector('.site')?.classList.toggle('carely-motion-paused',paused);},[paused]);return null;
}
