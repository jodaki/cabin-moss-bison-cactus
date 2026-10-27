import { LOOKS, useStudio, type BeanPreset, type LookId, type WrapMode } from "./store";

function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="row">
      <span>
        {props.label}: {props.value.toFixed(2)}
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function Panel() {
  const s = useStudio();
  return (
    <aside className="panel">
      <div className="brand">
        <h1>لوبیا</h1>
        <span>استودیو بسته‌بندی</span>
      </div>
      <p className="hint">
        لوبیاها داخل جعبه می‌مانند. جعبه را جابه‌جا کن تا داخل مدل شیشه‌ای بیفتد. مدل OBJ را بارگذاری کن و شیشه را روشن بگذار.
      </p>

      <section className="section">
        <h2>مدل سه‌بعدی OBJ</h2>
        <div className="checks">
          <label className="file">
            بارگذاری OBJ
            <input
              type="file"
              accept=".obj,text/plain"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                s.set({ objText: await file.text(), objName: file.name, showSampleJar: false });
              }}
            />
          </label>
          {s.objName && <span>{s.objName}</span>}
        </div>
        <label className="checks">
          <input
            type="checkbox"
            checked={s.showSampleJar}
            onChange={(e) => s.set({ showSampleJar: e.target.checked })}
          />
          ظرف نمونه شیشه‌ای
        </label>
        <label className="checks">
          <input type="checkbox" checked={s.glass} onChange={(e) => s.set({ glass: e.target.checked })} />
          شیشه‌ای و شفاف
        </label>
        <Slider label="شفافیت شیشه" value={s.glassAmount} min={0.2} max={1} step={0.01} onChange={(glassAmount) => s.set({ glassAmount })} />
        <Slider label="زبری شیشه" value={s.glassRough} min={0} max={0.6} step={0.01} onChange={(glassRough) => s.set({ glassRough })} />
        <label className="file">
          تکسچر مدل
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (s.modelTexUrl) URL.revokeObjectURL(s.modelTexUrl);
              s.set({ modelTexUrl: URL.createObjectURL(file), glass: false });
            }}
          />
        </label>
        <Slider label="تکسچر افقی" value={s.texOffsetX} min={-1} max={1} step={0.01} onChange={(texOffsetX) => s.set({ texOffsetX })} />
        <Slider label="تکسچر بالا / پایین" value={s.texOffsetY} min={-1} max={1} step={0.01} onChange={(texOffsetY) => s.set({ texOffsetY })} />
        <Slider label="تکرار تکسچر" value={s.texRepeat} min={0.2} max={6} step={0.05} onChange={(texRepeat) => s.set({ texRepeat })} />
        <Slider label="جای مدل X" value={s.modelX} min={-2} max={2} step={0.01} onChange={(modelX) => s.set({ modelX })} />
        <Slider label="جای مدل Y" value={s.modelY} min={-1} max={2} step={0.01} onChange={(modelY) => s.set({ modelY })} />
        <Slider label="جای مدل Z" value={s.modelZ} min={-2} max={2} step={0.01} onChange={(modelZ) => s.set({ modelZ })} />
        <Slider label="مقیاس مدل" value={s.modelScale} min={0.3} max={3} step={0.01} onChange={(modelScale) => s.set({ modelScale })} />
        <Slider label="چرخش مدل" value={s.modelRotY} min={-3.14} max={3.14} step={0.01} onChange={(modelRotY) => s.set({ modelRotY })} />
      </section>

      <section className="section">
        <h2>جعبه نگهداری لوبیا</h2>
        <p className="hint">ابعاد جعبه را با دهانه مدل یکی کن، بعد جعبه را داخل مدل بگذار. لوبیا از دیواره‌ها بیرون نمی‌ریزد.</p>
        <label className="checks">
          <input type="checkbox" checked={s.showWalls} onChange={(e) => s.set({ showWalls: e.target.checked })} />
          نمایش دیواره جعبه
        </label>
        <Slider label="پهنا" value={s.boxW} min={0.3} max={3} step={0.01} onChange={(boxW) => s.set({ boxW })} />
        <Slider label="ارتفاع" value={s.boxH} min={0.3} max={3} step={0.01} onChange={(boxH) => s.set({ boxH })} />
        <Slider label="عمق" value={s.boxD} min={0.3} max={3} step={0.01} onChange={(boxD) => s.set({ boxD })} />
        <Slider label="جای جعبه X" value={s.boxX} min={-2} max={2} step={0.01} onChange={(boxX) => s.set({ boxX })} />
        <Slider label="جای جعبه Y" value={s.boxY} min={0} max={2.5} step={0.01} onChange={(boxY) => s.set({ boxY })} />
        <Slider label="جای جعبه Z" value={s.boxZ} min={-2} max={2} step={0.01} onChange={(boxZ) => s.set({ boxZ })} />
      </section>

      <section className="section">
        <h2>لوبیاها</h2>
        <div className="looks">
          {(["red", "white", "pinto", "black", "mixed"] as BeanPreset[]).map((id) => (
            <button key={id} type="button" className={s.beanPreset === id ? "on" : ""} onClick={() => s.set({ beanPreset: id })}>
              {id === "red" ? "قرمز" : id === "white" ? "سفید" : id === "pinto" ? "چیتی" : id === "black" ? "سیاه" : "مخلوط"}
            </button>
          ))}
        </div>
        <div style={{ height: 8 }} />
        <label className="file">
          تکسچر لوبیا
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (s.beanTexUrl) URL.revokeObjectURL(s.beanTexUrl);
              s.set({ beanTexUrl: URL.createObjectURL(file) });
            }}
          />
        </label>
        {s.beanTexUrl && (
          <button type="button" className="ghost" onClick={() => s.set({ beanTexUrl: null })}>
            برگشت به تکسچر آماده
          </button>
        )}
        <Slider label="تعداد" value={s.count} min={20} max={280} step={1} onChange={(count) => s.set({ count })} />
        <Slider label="اندازه" value={s.beanSize} min={0.03} max={0.12} step={0.001} onChange={(beanSize) => s.set({ beanSize })} />
        <Slider label="کشیدگی" value={s.beanLength} min={0.6} max={2.2} step={0.01} onChange={(beanLength) => s.set({ beanLength })} />
        <Slider label="پهنا شکل" value={s.beanWidth} min={0.4} max={1.6} step={0.01} onChange={(beanWidth) => s.set({ beanWidth })} />
        <Slider label="ضخامت" value={s.beanThick} min={0.35} max={1.4} step={0.01} onChange={(beanThick) => s.set({ beanThick })} />
        <Slider label="تفاوت بین دانه‌ها" value={s.variation} min={0} max={0.8} step={0.01} onChange={(variation) => s.set({ variation })} />
        <button type="button" className="ghost" onClick={() => s.pour()}>
          ریختن دوباره داخل جعبه
        </button>
      </section>

      <section className="section">
        <h2>سلفون</h2>
        <div className="looks">
          {(
            [
              ["none", "بدون سلفون"],
              ["gloss", "سلفون براق"],
              ["matte", "سلفون مات"],
            ] as [WrapMode, string][]
          ).map(([id, label]) => (
            <button key={id} type="button" className={s.wrap === id ? "on" : ""} onClick={() => s.set({ wrap: id })}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>نور دوربین</h2>
        <div className="looks">
          {(Object.keys(LOOKS) as LookId[]).map((id) => (
            <button key={id} type="button" className={s.look === id ? "on" : ""} onClick={() => s.set({ look: id })}>
              {LOOKS[id].label}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
