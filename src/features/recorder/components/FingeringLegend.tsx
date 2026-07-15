export function FingeringLegend() {
  return (
    <div className="fingering-legend" aria-label="리코더 구멍 상태 설명">
      <span><i className="legend-hole open" aria-hidden="true" /> 열린 구멍 ○</span>
      <span><i className="legend-hole closed" aria-hidden="true" /> 막힌 구멍 ●</span>
      <span><i className="legend-arrow release" aria-hidden="true">↑</i> 떼기</span>
      <span><i className="legend-arrow press" aria-hidden="true">↓</i> 막기</span>
    </div>
  );
}
