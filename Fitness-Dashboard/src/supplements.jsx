import { Card, H2, Eyebrow, Pill } from './ui.jsx';
import { SUPPLEMENTS, SKIP_SUPPS, SUPP_SCHEDULE } from './data/nutrition.js';

const TIER_TONE = { 'Vacib': 'cobalt', 'Tövsiyə': 'good', 'Opsional': 'neutral' };

export function Supplements() {
  return (
    <div className="grid gap-5">
      <Card>
        <H2 sub="Əlavələr planın 5%-idir: yemək, məşq və yuxu 95%. Alış-veriş üçün Trendyol-da axtarış sözləri verilib; brend yox, tərkib və halal sertifikatı vacibdir.">Əlavə qidalar</H2>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Saat</th><th>Nə vaxt</th><th>Nə</th><th>Qeyd</th></tr></thead>
            <tbody>
              {SUPP_SCHEDULE.map(([t, w, x, n]) => (
                <tr key={t}><td className="num">{t}</td><td>{w}</td><td className="text-ink font-medium">{x}</td><td className="text-ink3">{n}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        {SUPPLEMENTS.map((s) => (
          <Card key={s.id} className="supp">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={TIER_TONE[s.tier]}>{s.tier}</Pill>
              <span className="text-xs text-ink3">{s.evidence}</span>
            </div>
            <h3 className="h3 mt-2">{s.name}</h3>
            <p className="text-sm text-ink2 mt-1">{s.why}</p>
            <dl className="supp-dl mt-3">
              <dt>Doza</dt><dd>{s.dose}</dd>
              <dt>Vaxt</dt><dd>{s.when}</dd>
              <dt>Nəyə bax</dt><dd>{s.look}</dd>
            </dl>
            <p className="note mt-3">{s.note}</p>
            {s.q ? (
              <a className="btn btn-ghost mt-3" href={`https://www.trendyol.com/sr?q=${encodeURIComponent(s.q)}`} target="_blank" rel="noopener noreferrer">
                Trendyol-da axtar: “{s.q}”
              </a>
            ) : null}
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <H2>Pul itkisi — alma</H2>
          <ul className="grid gap-2">
            {SKIP_SUPPS.map(([n, w]) => (
              <li key={n} className="skip-row"><b className="text-ink">{n}</b><span className="text-sm text-ink2">{w}</span></li>
            ))}
          </ul>
        </Card>
        <Card>
          <Eyebrow>Sağlamlıq</Eyebrow>
          <h3 className="h3 mt-1">Başlamazdan əvvəl qan analizi</h3>
          <p className="text-sm text-ink2 mt-2">Başlanğıcda və 6 aydan sonra: ümumi qan analizi, qlükoza və HbA1c, lipid profili, D vitamini (25-OH), ferritin, TSH. Qarın nahiyəsində yağlanma insulin həssaslığı ilə bağlı ola bilər — rəqəmləri bilmək planı dəqiqləşdirir.</p>
          <p className="text-sm text-ink2 mt-2">Xroniki xəstəlik, təzyiq problemi və ya dərman qəbulu varsa, əlavələrə başlamazdan əvvəl həkimlə danış.</p>
        </Card>
      </div>
    </div>
  );
}
