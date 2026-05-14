'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import type { AppPhase } from '@/lib/types';

const BIO_PARAGRAPHS = [
  'Edith J. Freitag wurde 1937 im schlesischen Dorf Jauer geboren, das heute zu Polen gehört und Jaworow heisst. Sie wuchs als fünftes von sechs Kindern auf einem Bauernhof auf. Ihre Kindheit war geprägt vom Zweiten Weltkrieg und den politischen Umbrüchen der Nachkriegszeit.',
  '1946 wurde die Familie im Zuge der Nachkriegsereignisse aus Schlesien nach Leipzig in die damalige DDR zwangsausgesiedelt. Ein Jahr später verstarb ihre Mutter. 1952 gelang der Familie die Flucht über Berlin in die Bundesrepublik Deutschland nach Köln.',
  'Nach ihrer Schulzeit absolvierte Edith Freitag eine kaufmännische Ausbildung. Es folgten längere Aufenthalte in England sowie in der französischsprachigen Schweiz. 1967 schloss sie ihre Ausbildung an der Höheren Fachschule für Sozialarbeit in Freiburg im Breisgau mit einem Diplom ab. Anschliessend arbeitete sie als Sozialarbeiterin in einem Industrieunternehmen im Kanton Schaffhausen.',
  'Im selben Jahr heiratete sie Hans-Peter Freitag und erhielt das Schweizer Bürgerrecht mit Heimatort Davos. Gemeinsam lebte das Paar in verschiedenen Regionen der Schweiz, unter anderem auf der Forch, in Meilen am Zürichsee sowie später während vieler Jahre in Jenins im Kanton Graubünden. In Meilen wuchsen ihre beiden Söhne Markus Freitag und Daniel Freitag auf.',
  'Neben ihrer Tätigkeit als Sozialarbeiterin absolvierte Edith Freitag eine Ausbildung im Ausdrucksmalen nach Arno Stern. Sie leitete später eigene Malgruppen und führte ein Atelier für Ausdrucksmalen. Zudem arbeitete sie zeitweise in einer psychiatrischen Klinik.',
  'Ihr Leben war von grosser geografischer und kultureller Beweglichkeit geprägt. Sie lebte in verschiedenen Ländern und unternahm zahlreiche Reisen, darunter eine mehrmonatige Studienreise nach Indien. Gleichzeitig engagierte sie sich über viele Jahre in sozialen und kulturellen Projekten. In Jenins war sie unter anderem Mitgründerin eines Frauenstamms, unterstützte Flüchtlingsfamilien, begleitete einen Primarschüler als Vormund und betreute zeitweise ein Malatelier im Kindergarten.',
  'Ein wichtiger Bestandteil ihres Lebens war das Schreiben. Sie verfasste autobiografische Texte, Erinnerungen und literarische Reflexionen über Herkunft, Heimat, Flucht, Gesellschaft und persönliche Entwicklung. Besonders beschäftigte sie die Erfahrung des Flüchtlingsseins und die Frage nach Zugehörigkeit und Beheimatung.',
  '2019 erlitt Edith Freitag eine Hirnblutung, von der sie sich teilweise wieder erholte. Ihre letzten Lebensjahre verbrachte sie trotz gesundheitlicher Einschränkungen weiterhin aktiv im familiären Umfeld in Jenins. Nach einer zweiten Hirnblutung verstarb sie im Mai 2023 im Alter von 85 Jahren im Kantonsspital Chur.',
];

const HUE = 35; // Warmes, erdiges Gold

export function BiographyView() {
  const setPhase = useAppStore((s: { setPhase: (p: AppPhase) => void }) => s.setPhase);

  const colorAccent = `hsl(${HUE}, 22%, 78%)`;
  const colorAccentLight = `hsl(${HUE}, 12%, 94%)`;
  const colorAccentMid = `hsl(${HUE}, 16%, 88%)`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      className="fixed inset-0 flex items-center justify-center"
    >
      {/* Verlauf wie bei PoemReveal */}
      <div className="absolute inset-0"
        style={{
          background: `
            linear-gradient(
              to right,
              ${colorAccent} 0%,
              ${colorAccentMid} 18%,
              ${colorAccentLight} 35%,
              #faf9f7 50%,
              ${colorAccentLight} 65%,
              ${colorAccentMid} 82%,
              ${colorAccent} 100%
            )
          `,
        }}
      />

      {/* Scrollbarer Text-Container */}
      <div className="relative z-10 max-w-2xl w-full max-h-full overflow-y-auto poem-scroll py-16 px-8">
        <article lang="de" aria-label="Biografischer Lebenslauf von Edith J. Freitag-Dierschke">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="poem-text text-2xl md:text-3xl mb-10 text-center"
            style={{ color: `hsl(${HUE}, 22%, 28%)` }}
          >
            Edith J. Freitag-Dierschke
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-center text-sm font-[family-name:var(--font-ui)] mb-12"
            style={{ color: `hsl(${HUE}, 15%, 50%)` }}
          >
            Biografischer Lebenslauf
          </motion.p>

          <div className="space-y-6">
            {BIO_PARAGRAPHS.map((para, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.6,
                  delay: 0.8 + i * 0.15,
                  ease: 'easeOut',
                }}
                className="poem-text text-base md:text-lg leading-relaxed"
                style={{ color: `hsl(${HUE}, 12%, 22%)` }}
              >
                {para}
              </motion.p>
            ))}
          </div>

          {/* Zurück-Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 + BIO_PARAGRAPHS.length * 0.15 + 0.5 }}
            className="flex justify-center mt-16 pb-8"
          >
            <button
              onClick={() => setPhase('galaxy')}
              className="text-sm transition-colors duration-500
                font-[family-name:var(--font-ui)]
                focus:outline-none focus-visible:underline"
              style={{ color: `hsl(${HUE}, 15%, 55%)` }}
              onMouseEnter={(e) => (e.currentTarget.style.color = `hsl(${HUE}, 20%, 35%)`)}
              onMouseLeave={(e) => (e.currentTarget.style.color = `hsl(${HUE}, 15%, 55%)`)}
              aria-label="Zurück zur Galaxie"
            >
              &larr; zurück
            </button>
          </motion.div>
        </article>
      </div>
    </motion.div>
  );
}
