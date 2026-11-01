import type {Metadata} from 'next';
import './globals.css';
import './redesign.css';
import './sky.css';
import {ThemeProvider} from '@/components/theme';
import {themeBootScript} from '@/lib/theme';
export const metadata:Metadata={
 title:'Carely — Medicine details, together',
 description:'India-first medicine information and personal cabinet. Scan printed codes, check official CDSCO alerts, and share only with permission.',
 icons:{icon:'/favicon.svg'},
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeBootScript}}/></head><body><ThemeProvider>{children}</ThemeProvider></body></html>;}
