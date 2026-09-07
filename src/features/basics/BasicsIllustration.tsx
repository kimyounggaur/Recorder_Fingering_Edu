export function PostureIllustration({ standing }: { standing: boolean }) {
  return <svg className="basics-illustration" viewBox="0 0 400 420" role="img" aria-label={standing ? "허리를 펴고 양발을 벌려 선 자세" : "등받이에서 허리를 떼고 두 발을 바닥에 댄 자세"}>
    <g fill="none" stroke="#263a46" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M40 386 H360" stroke="#aab9c3" />
      {!standing ? <path d="M120 180 V288 H263 M128 290 V382 M252 290 V382" stroke="#768996" /> : null}
      <circle cx="200" cy="66" r="33" fill="#fff2ed" />
      <path d="M173 92 L168 128 L170 245 Q199 261 230 245 L232 128 L222 96" fill="#e7f3fa" />
      <path d="M168 127 Q138 151 126 211 L170 186 M231 127 Q259 156 272 209 L223 192" />
      <path d="M196 98 L218 240" stroke="#496679" strokeWidth={10} />
      <path d="M181 164 L205 173 M217 184 L235 190" stroke="#263a46" />
      {standing ? <><path d="M177 254 L161 368 L142 380 H180 M222 254 L239 368 L258 380 H220" /><path d="M200 266 V345" /></> : <><path d="M173 257 L243 282 L255 365 L279 380 H239 L218 303 L165 291" fill="#e7f3fa" /><path d="M208 260 L275 280 L292 366 L318 380 H280" /></>}
    </g>
    <g fill="#fff" stroke="#167355" strokeWidth={4}>
      <circle cx="167" cy="133" r="9" /><circle cx="170" cy="235" r="9" />
      <circle cx={standing ? 160 : 255} cy="370" r="9" />
    </g>
  </svg>;
}
export function MouthIllustration({ caution = false }: { caution?: boolean }) {
  return <svg className="mouth-illustration" viewBox="0 0 320 230" role="img" aria-label={caution ? "너무 깊게 물어 이가 취구에 닿은 주의 자세" : "입술로 취구 끝을 가볍게 덮은 입 모양"}>
    <g stroke="#263a46" strokeWidth={4} strokeLinejoin="round" fill="none">
      <path d="M70 26 Q185 5 205 91 L220 107 L201 112 L207 130 L196 145 Q202 178 170 185 L164 218 M83 33 Q41 106 85 166 L90 218" fill="#fff2ed" />
      <path d={caution ? "M161 112 L294 147 L287 176 L169 139 Z" : "M201 118 L300 143 L294 169 L202 144 Z"} fill="#e7f3fa" />
      <path d="M200 115 L213 122 M196 145 L211 140" stroke="#9e4256" strokeWidth={6} />
      <path d={caution ? "M165 111 L168 130 H187 L185 113" : "M158 112 L160 124 H177 L176 111"} fill="#fff" />
      <path d="M114 145 Q151 130 175 143" stroke="#b56d7b" />
      <path d="M183 88 L189 88" strokeWidth={7} strokeLinecap="round" />
    </g>
    <circle cx={caution ? 184 : 209} cy="132" r="31" fill="none" stroke={caution ? "#a6273b" : "#167355"} strokeWidth={3} strokeDasharray={caution ? "6 4" : undefined} />
  </svg>;
}
export function FingerIllustration() {
  return <svg className="basics-illustration" viewBox="0 0 400 300" role="img" aria-label="손가락의 지문이 있는 넓은 살집 부분으로 구멍을 막은 모습">
    <g stroke="#263a46" strokeWidth={4} strokeLinejoin="round">
      <path d="M50 226 H350 V267 H50 Z" fill="#e7f3fa" />
      <ellipse cx="265" cy="226" rx="24" ry="8" fill="#263a46" />
      <path d="M25 80 Q99 65 169 113 L286 181 Q317 200 292 224 Q275 238 248 220 L141 169 Q105 164 25 179" fill="#fff2ed" />
      <path d="M237 158 Q266 159 288 179 Q303 193 288 198 Q267 198 248 185 Z" fill="#fff" />
      <path d="M228 207 Q250 181 277 207 M239 213 Q255 194 269 213 M249 218 Q257 204 262 218" fill="none" stroke="#a06c6b" strokeWidth={2} />
      <ellipse cx="257" cy="210" rx="40" ry="31" fill="none" stroke="#167355" strokeWidth={4} />
    </g>
  </svg>;
}
