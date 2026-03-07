export interface Country {
  name: string
  code: string
  lat: number
  lng: number
  region: string
  flag: string
}

export const countries: Country[] = [
  // Middle East
  { name: 'Qatar', code: 'QA', lat: 25.276, lng: 51.52, region: 'Middle East', flag: '🇶🇦' },
  { name: 'United Arab Emirates', code: 'AE', lat: 23.424, lng: 53.848, region: 'Middle East', flag: '🇦🇪' },
  { name: 'Kuwait', code: 'KW', lat: 29.376, lng: 47.977, region: 'Middle East', flag: '🇰🇼' },
  { name: 'Bahrain', code: 'BH', lat: 26.067, lng: 50.558, region: 'Middle East', flag: '🇧🇭' },
  { name: 'Iraq', code: 'IQ', lat: 33.312, lng: 44.361, region: 'Middle East', flag: '🇮🇶' },
  { name: 'Saudi Arabia', code: 'SA', lat: 23.886, lng: 45.079, region: 'Middle East', flag: '🇸🇦' },
  { name: 'Turkey', code: 'TR', lat: 38.964, lng: 35.243, region: 'Middle East', flag: '🇹🇷' },
  { name: 'Jordan', code: 'JO', lat: 30.585, lng: 36.239, region: 'Middle East', flag: '🇯🇴' },
  { name: 'Oman', code: 'OM', lat: 21.513, lng: 55.923, region: 'Middle East', flag: '🇴🇲' },
  { name: 'Syria', code: 'SY', lat: 34.802, lng: 38.997, region: 'Middle East', flag: '🇸🇾' },
  // East Asia
  { name: 'South Korea', code: 'KR', lat: 35.907, lng: 127.767, region: 'East Asia', flag: '🇰🇷' },
  { name: 'Japan', code: 'JP', lat: 36.205, lng: 138.253, region: 'East Asia', flag: '🇯🇵' },
  { name: 'Taiwan', code: 'TW', lat: 23.698, lng: 120.961, region: 'East Asia', flag: '🇹🇼' },
  { name: 'Philippines', code: 'PH', lat: 12.879, lng: 121.774, region: 'East Asia', flag: '🇵🇭' },
  { name: 'China', code: 'CN', lat: 35.862, lng: 104.195, region: 'East Asia', flag: '🇨🇳' },
  { name: 'North Korea', code: 'KP', lat: 40.339, lng: 127.510, region: 'East Asia', flag: '🇰🇵' },
  // Europe
  { name: 'Germany', code: 'DE', lat: 51.166, lng: 10.452, region: 'Europe', flag: '🇩🇪' },
  { name: 'Italy', code: 'IT', lat: 41.872, lng: 12.567, region: 'Europe', flag: '🇮🇹' },
  { name: 'United Kingdom', code: 'GB', lat: 55.378, lng: -3.436, region: 'Europe', flag: '🇬🇧' },
  { name: 'Poland', code: 'PL', lat: 51.919, lng: 19.145, region: 'Europe', flag: '🇵🇱' },
  { name: 'Romania', code: 'RO', lat: 45.943, lng: 24.967, region: 'Europe', flag: '🇷🇴' },
  { name: 'Spain', code: 'ES', lat: 40.464, lng: -3.749, region: 'Europe', flag: '🇪🇸' },
  { name: 'Greece', code: 'GR', lat: 39.074, lng: 21.824, region: 'Europe', flag: '🇬🇷' },
  { name: 'Norway', code: 'NO', lat: 60.472, lng: 8.469, region: 'Europe', flag: '🇳🇴' },
  { name: 'Belgium', code: 'BE', lat: 50.504, lng: 4.470, region: 'Europe', flag: '🇧🇪' },
  { name: 'Netherlands', code: 'NL', lat: 52.133, lng: 5.291, region: 'Europe', flag: '🇳🇱' },
  { name: 'Ukraine', code: 'UA', lat: 48.380, lng: 31.166, region: 'Europe', flag: '🇺🇦' },
  // Americas
  { name: 'United States', code: 'US', lat: 37.091, lng: -95.713, region: 'Americas', flag: '🇺🇸' },
  { name: 'Cuba', code: 'CU', lat: 21.521, lng: -77.781, region: 'Americas', flag: '🇨🇺' },
  { name: 'Honduras', code: 'HN', lat: 15.200, lng: -86.242, region: 'Americas', flag: '🇭🇳' },
  { name: 'Colombia', code: 'CO', lat: 4.571, lng: -74.297, region: 'Americas', flag: '🇨🇴' },
  { name: 'Puerto Rico', code: 'PR', lat: 18.221, lng: -66.590, region: 'Americas', flag: '🇵🇷' },
  // Africa
  { name: 'Djibouti', code: 'DJ', lat: 11.825, lng: 42.590, region: 'Africa', flag: '🇩🇯' },
  { name: 'Niger', code: 'NE', lat: 17.608, lng: 8.082, region: 'Africa', flag: '🇳🇪' },
  { name: 'Kenya', code: 'KE', lat: -0.024, lng: 37.907, region: 'Africa', flag: '🇰🇪' },
  { name: 'Somalia', code: 'SO', lat: 5.152, lng: 46.200, region: 'Africa', flag: '🇸🇴' },
  { name: 'Ghana', code: 'GH', lat: 7.946, lng: -1.023, region: 'Africa', flag: '🇬🇭' },
  // Indo-Pacific
  { name: 'Australia', code: 'AU', lat: -25.274, lng: 133.775, region: 'Indo-Pacific', flag: '🇦🇺' },
  { name: 'Guam', code: 'GU', lat: 13.444, lng: 144.794, region: 'Indo-Pacific', flag: '🇬🇺' },
  { name: 'Singapore', code: 'SG', lat: 1.352, lng: 103.820, region: 'Indo-Pacific', flag: '🇸🇬' },
  { name: 'Diego Garcia', code: 'IO', lat: -7.320, lng: 72.423, region: 'Indo-Pacific', flag: '🇮🇴' },
  { name: 'Hawaii', code: 'HI', lat: 19.896, lng: -155.582, region: 'Indo-Pacific', flag: '🇺🇸' },
  { name: 'Marshall Islands', code: 'MH', lat: 7.131, lng: 171.184, region: 'Indo-Pacific', flag: '🇲🇭' },
  { name: 'India', code: 'IN', lat: 20.594, lng: 78.963, region: 'Indo-Pacific', flag: '🇮🇳' },
  { name: 'Thailand', code: 'TH', lat: 15.870, lng: 100.993, region: 'Indo-Pacific', flag: '🇹🇭' },
]
