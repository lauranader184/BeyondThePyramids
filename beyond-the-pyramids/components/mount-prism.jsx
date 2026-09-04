import { createRoot } from 'react-dom/client';
import Prism from './Prism.jsx';

const el = document.getElementById('heroPrism');
if (el) {
  createRoot(el).render(
    <Prism
      animationType="rotate"
      timeScale={0.1}
      height={3.5}
      baseWidth={5.5}
      scale={2.8}
      hueShift={-0.0416}
      colorFrequency={0.95}
      noise={0}
      glow={0.9}
    />
  );
}
