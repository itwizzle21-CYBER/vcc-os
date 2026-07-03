import type { AppView, RecommendedMove } from "../../lib/types/vcc";

export function RecommendedMoveCard({
  move,
  open,
}: {
  move: RecommendedMove;
  open: (view: AppView) => void;
}) {
  return (
    <button className={`movePanel ${move.tone}`} onClick={() => open(move.source)}>
      <div className="moveTop">
        <div>
          <p className="kicker">TODAY_RECOMMENDED_MOVE</p>
          <h2>{move.title}</h2>
        </div>
        <span>OPEN SOURCE â†’</span>
      </div>

      <div className="moveGrid">
        <div>
          <p>WHY</p>
          <h3>{move.why}</h3>
        </div>

        <div>
          <p>DO FIRST</p>
          <h3>{move.doFirst}</h3>
        </div>

        <div>
          <p>DO NOT DO</p>
          <h3>{move.doNotDo}</h3>
        </div>

        <div>
          <p>NEXT CHECKPOINT</p>
          <h3>{move.checkpoint}</h3>
        </div>
      </div>
    </button>
  );
}
