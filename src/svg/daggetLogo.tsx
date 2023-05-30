import { FC } from 'react';
import { SvgXml } from 'react-native-svg';
const xmlData = `
<svg width="213" height="134" viewBox="0 0 213 134" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="mask0_34_1458" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="213" height="134">
<rect width="213" height="134" fill="#D9D9D9"/>
</mask>
<g mask="url(#mask0_34_1458)">
<path d="M117.809 29.8019C103.671 45.0413 92.3238 67.4363 85.3999 77.3248L100.523 87.9144C107.447 78.0259 124.733 59.7894 133.514 40.7988C139.367 28.1408 145.502 7.58367 145.502 7.58367C145.502 7.58367 127.827 19.9779 117.809 29.8019Z" fill="url(#paint0_linear_34_1458)"/>
<path d="M93.8323 96.2322L79.8721 86.4572C76.3224 95.2408 63.5804 109.724 63.5804 109.724L77.5406 119.499C77.5406 119.499 86.7925 102.572 93.8323 96.2322Z" fill="url(#paint1_linear_34_1458)"/>
<path d="M78.9174 120.463L62.2037 108.76C60.394 107.493 57.8999 107.933 56.6327 109.742L55.5193 111.333C54.2522 113.142 54.6919 115.636 56.5016 116.903L73.2153 128.607C75.0249 129.874 77.5191 129.434 78.7862 127.624L79.8997 126.034C81.1668 124.224 80.727 121.73 78.9174 120.463Z" fill="url(#paint2_linear_34_1458)"/>
<path d="M105.972 91.7294L79.9513 73.5097C78.1417 72.2426 75.6475 72.6823 74.3804 74.492L72.8597 76.6639C71.5925 78.4735 72.0323 80.9677 73.842 82.2348L99.8625 100.455C101.672 101.722 104.166 101.282 105.433 99.4722L106.954 97.3003C108.221 95.4907 107.781 92.9965 105.972 91.7294Z" fill="url(#paint3_linear_34_1458)"/>
</g>
<defs>
<linearGradient id="paint0_linear_34_1458" x1="98.5049" y1="36.1441" x2="134.299" y2="60.9688" gradientUnits="userSpaceOnUse">
<stop offset="0.00500457" stop-color="#4B4B4B"/>
<stop offset="0.508468" stop-color="#8E8E8E"/>
<stop offset="0.518023" stop-color="#BEBBBB"/>
<stop offset="1" stop-color="#EFEFEF"/>
</linearGradient>
<linearGradient id="paint1_linear_34_1458" x1="63.2885" y1="92.7213" x2="90.4224" y2="111.773" gradientUnits="userSpaceOnUse">
<stop stop-color="#9D7D4D"/>
<stop offset="0.541346" stop-color="#947648"/>
<stop offset="1" stop-color="#48371E"/>
</linearGradient>
<linearGradient id="paint2_linear_34_1458" x1="53.4741" y1="84.0615" x2="101.969" y2="116.969" gradientUnits="userSpaceOnUse">
<stop stop-color="#9D9125"/>
<stop offset="0.46949" stop-color="#D0BD0F"/>
<stop offset="1" stop-color="#FFF279"/>
</linearGradient>
<linearGradient id="paint3_linear_34_1458" x1="53.4741" y1="84.0615" x2="101.969" y2="116.969" gradientUnits="userSpaceOnUse">
<stop stop-color="#9D9125"/>
<stop offset="0.46949" stop-color="#D0BD0F"/>
<stop offset="1" stop-color="#FFF279"/>
</linearGradient>
</defs>
</svg>
`;
const xmlData2 = `
<svg width="213" height="134" viewBox="0 0 213 134" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="mask0_34_1460" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="213" height="134">
<rect width="213" height="134" fill="#D9D9D9"/>
</mask>
<g mask="url(#mask0_34_1460)">
<path d="M117.809 29.8019C103.671 45.0413 92.3238 67.4363 85.3999 77.3248L100.523 87.9144C107.447 78.0259 124.733 59.7894 133.514 40.7988C139.367 28.1408 145.502 7.58367 145.502 7.58367C145.502 7.58367 127.827 19.9779 117.809 29.8019Z" stroke="#ECECEC" stroke-width="2"/>
<path d="M93.8323 96.2322L79.8721 86.4572C76.3224 95.2408 63.5804 109.724 63.5804 109.724L77.5406 119.499C77.5406 119.499 86.7925 102.572 93.8323 96.2322Z" stroke="#ECECEC" stroke-width="2"/>
<path d="M78.9174 120.463L62.2037 108.76C60.394 107.493 57.8999 107.933 56.6327 109.742L55.5193 111.333C54.2522 113.142 54.6919 115.636 56.5016 116.903L73.2153 128.607C75.0249 129.874 77.5191 129.434 78.7862 127.624L79.8997 126.034C81.1668 124.224 80.727 121.73 78.9174 120.463Z" stroke="#ECECEC" stroke-width="2"/>
<path d="M105.972 91.7294L79.9513 73.5097C78.1417 72.2426 75.6475 72.6823 74.3804 74.492L72.8597 76.6639C71.5925 78.4735 72.0323 80.9677 73.842 82.2348L99.8625 100.455C101.672 101.722 104.166 101.282 105.433 99.4722L106.954 97.3003C108.221 95.4907 107.781 92.9965 105.972 91.7294Z" stroke="#ECECEC" stroke-width="2"/>
</g>
</svg>`;

export const DaggerLogoSVG: FC<{isOutline?: boolean}> = ({isOutline}) => 
  <SvgXml xml={isOutline ? xmlData : xmlData2} width="255" height="160"/>;
