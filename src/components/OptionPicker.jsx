import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import Icon from "./Icon";
import { useStore } from "../context/StoreContext";

/* Colour + size selector. Parent owns { c, s }; ref.requireSize() shakes the
   size row and shows the error when no size is chosen (returns true if blocked). */
const OptionPicker = forwardRef(function OptionPicker({ product: p, value, onChange }, ref) {
  const { openSheet } = useStore();
  const [sizeError, setSizeError] = useState(false);
  const sizesRef = useRef(null);

  useImperativeHandle(ref, () => ({
    requireSize() {
      if (value.s) return false;
      const g = sizesRef.current;
      g.classList.remove("shake");
      void g.offsetWidth;
      g.classList.add("shake");
      setSizeError(true);
      return true;
    },
    sizesEl: () => sizesRef.current,
  }), [value.s]);

  return (
    <>
      <div className="opt">
        <div className="opt-h">Colour <span>{p.colors[value.c][1]}</span></div>
        <div className="colors" role="group" aria-label="Colour">
          {p.colors.map((c, i) => (
            <button type="button" key={c[1]} style={{ background: c[0] }} aria-pressed={i === value.c} aria-label={c[1]}
              onClick={() => onChange({ ...value, c: i })} />
          ))}
        </div>
      </div>
      <div className="opt">
        <div className="opt-h">Size {p.sizes.length > 1 && (
          <button className="view-all" type="button" onClick={() => openSheet("sizeSheet")}><Icon name="i-ruler" />Size guide</button>
        )}</div>
        <div className="sizes" role="group" aria-label="Size" ref={sizesRef}>
          {p.sizes.map((s) => (
            <button type="button" key={s} aria-pressed={s === value.s}
              onClick={() => { setSizeError(false); onChange({ ...value, s }); }}>{s}</button>
          ))}
        </div>
        <p className="err-t" hidden={!sizeError}>Please select a size.</p>
      </div>
    </>
  );
});

export default OptionPicker;
