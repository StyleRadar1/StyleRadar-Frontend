(() => {
  const root = document.documentElement;
  const map = {'#48119a':['#FFFFFF','#B9B9CA'], '#b9b9ca':['#262626','#B9B9CA'], '#e8dccb':['#262626','#E8DCCB'], '#ffffff':['#262626','#FFFFFF']};
  let last = '';
  const upd = () => { const a = getComputedStyle(root).getPropertyValue('--acc').trim().toLowerCase(); if (a === last) return; last = a;
    const [fg, tx] = map[a] || ['#FFFFFF', '#B9B9CA']; root.style.setProperty('--acc-fg', fg); root.style.setProperty('--acc-tx', tx); };
  new MutationObserver(upd).observe(root, {attributes:true, attributeFilter:['style']}); upd();
})();
