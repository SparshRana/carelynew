/** Carely now intentionally has one light, sky-blue appearance. */
export type Theme='light';
export const THEME_KEY='carely:theme';
export const resolveTheme=(_stored:string|null,_systemDark:boolean):Theme=>'light';
export const themeBootScript=`(()=>{document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light'})()`;
