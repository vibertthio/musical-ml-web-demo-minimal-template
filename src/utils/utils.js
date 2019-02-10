function lerp (low, high, from, to, v) {
	const ratio = (v - low) / (high - low);
	return from + (to - from) * ratio;
}

function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}


function lerpColor(a, b, amount) {
  var ah = +a.replace('#', '0x'),
    bh = +b.replace('#', '0x'),
    ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
    br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
    rr = ar + amount * (br - ar),
    rg = ag + amount * (bg - ag),
    rb = ab + amount * (bb - ab);

  return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
}

export {
	lerp,
  clamp,
  lerpColor,
};
