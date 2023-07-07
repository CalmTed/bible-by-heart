import { SvgXml } from 'react-native-svg';
const xmlData = `<svg width="141" height="130" viewBox="0 0 141 130" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_d_169_37)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M82.9999 108.5C84.8333 108.667 88.0001 107 84.5001 104C76.4851 98.7902 76.5001 97.1137 76.5644 89.9597C76.5803 88.188 76.5992 86.0804 76.4999 83.5C80.3333 82.5 89 78.6 93 71H99.5C103 71 109.695 68.7288 114 65.5C115.736 64.1979 118.226 62.2363 120.774 60.2287C124.097 57.611 127.519 54.9149 129.5 53.5C132 51 136.4 44.1 136 38.5C135.5 31.5 131.5 18 114.5 18H107.5V7.5C107.667 6.5 107.4 4.5 105 4.5H36.5C35.5 4.5 33.5 5.1 33.5 7.5V18H26C18.8333 18.1667 4.59996 22.6 4.99996 39C5.06088 41.5 5.9 47.8 13.5 55C21.1 62.2 25.5 64.5 27.5001 65.5C27.6854 65.6112 27.8911 65.7362 28.1151 65.8722C30.9117 67.5712 36.5559 71 41.0001 71H48.0001C50.5001 75 57.2001 83.1 64.0001 83.5C64.5001 96 62.5001 100.5 55.5001 104C52.0001 107 55.5001 108.5 56.5001 108.5H82.9999ZM116 27H107.5C108.3 44.6 102.167 57.5 99 61.5C104.823 61.5 110.948 56.3754 116.204 51.9777C117.718 50.7117 119.159 49.5059 120.5 48.5C125.3 44.9 126.5 41 126.5 38C126.1 29.6 119.333 27.1667 116 27ZM25 27.5H33.5C32.7 45.1 38.8333 57.5 42 61.5C36.1765 61.5 30.0516 56.3754 24.7955 51.9777L24.7955 51.9777C23.2823 50.7117 21.8412 49.5059 20.5 48.5C15.7 44.9 14.5 40.3333 14.5 38.5C14.9 30.1 21.6667 27.6667 25 27.5Z" fill="url(#paint0_linear_169_37)"/>
</g>
<path d="M92 108H48C46.8954 108 46 108.895 46 110V128C46 129.105 46.8954 130 48 130H92C93.1046 130 94 129.105 94 128V110C94 108.895 93.1046 108 92 108Z" fill="url(#paint1_linear_169_37)"/>
<defs>
<filter id="filter0_d_169_37" x="0.991699" y="0.5" width="139.034" height="112.011" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.842054 0 0 0 0 0.741356 0 0 0 0 0.384335 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_169_37"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_169_37" result="shape"/>
</filter>
<linearGradient id="paint0_linear_169_37" x1="49" y1="-3" x2="97" y2="125.5" gradientUnits="userSpaceOnUse">
<stop stop-color="#FED714"/>
<stop offset="1" stop-color="#FEB289"/>
</linearGradient>
<linearGradient id="paint1_linear_169_37" x1="68.3256" y1="107.5" x2="71.4721" y2="133.592" gradientUnits="userSpaceOnUse">
<stop stop-color="#604E22"/>
<stop offset="0.239583" stop-color="#53441E"/>
<stop offset="0.270833" stop-color="#52431D"/>
<stop offset="0.4375" stop-color="#493C1A"/>
<stop offset="1" stop-color="#211A0A"/>
</linearGradient>
</defs>
</svg>`;

export const FinishCupSVG = () => (
    <SvgXml xml={xmlData} width="195" height="187" />
);
