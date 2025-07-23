const MARGIN = 15;
const STORAGE_KEY = 'cv_data';

(function () {
  const downloadBtn = document.querySelector('.js-download-pdf');
  const clearBtn = document.querySelector('.js-clear-data');
  const editableEls = document.querySelectorAll('.editable');

  document.addEventListener('click', function (e) {
    const target = e.target.closest('.ripple');
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const wave = document.createElement('span');
    wave.className = 'ripple__wave';
    wave.style.width = wave.style.height = size + 'px';
    wave.style.left = x + 'px';
    wave.style.top = y + 'px';
    target.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove());
  });

  document.addEventListener('DOMContentLoaded', () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      editableEls.forEach(el => {
        const key = el.dataset.key;
        if (saved[key]) el.textContent = saved[key];
      });
    } catch (e) {
      console.warn('Local storage parse error', e);
    }
  });

  let saveTimer;
  const saveAll = () => {
    const data = {};
    editableEls.forEach(el => data[el.dataset.key] = el.textContent.trim());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };
  const scheduleSave = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveAll, 400);
  };

  const startEdit = (el) => {
    if (el.isContentEditable) return;
    el.contentEditable = true;
    placeCaretAtEnd(el);
  };

  const finishEdit = (el) => {
    if (!el.isContentEditable) return;
    el.contentEditable = false;
    el.classList.remove('u-anim-edit');
    void el.offsetWidth;
    el.classList.add('u-anim-edit');
    scheduleSave();
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('.editable');
    if (!el) return;
    startEdit(el);
  });

  editableEls.forEach(el => {
    el.addEventListener('blur', () => finishEdit(el));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        el.blur();
      }
    });
  });

  clearBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

  downloadBtn.addEventListener('click', async () => {
    editableEls.forEach(el => {
      if (el.isContentEditable) { el.blur(); }
    });

    editableEls.forEach(el => el.classList.remove('u-anim-edit'));
    document.body.classList.add('pdf-mode');

    const resume = document.getElementById('resume');
    const canvas = await html2canvas(resume, { scale: 2, backgroundColor: '#fff' });
    const imgData = canvas.toDataURL('image/png');

    document.body.classList.remove('pdf-mode');

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const ratio = imgProps.width / imgProps.height;

    const maxW = pageW - MARGIN * 2;
    const maxH = pageH - MARGIN * 2;

    let drawW = maxW;
    let drawH = drawW / ratio;

    if (drawH > maxH) {
      drawH = maxH;
      drawW = drawH * ratio;
    }

    const x = (pageW - drawW) / 2;
    const y = (pageH - drawH) / 2;

    pdf.addImage(imgData, 'PNG', x, y, drawW, drawH);

    pdf.save('resume.pdf');
  });

  const placeCaretAtEnd = (el) => {
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  };
})();
