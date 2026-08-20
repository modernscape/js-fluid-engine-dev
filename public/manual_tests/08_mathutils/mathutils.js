// === 数学ユーティリティ関数（JS移植版） ===

/**
 * 線形補間 (Linear Interpolation)
 */
export function lerp(f0, f1, t) {
    return f0 * (1 - t) + f1 * t;
}

/**
 * 最近傍（Nearest Neighbor）のシミュレーション用
 */
export function nearest(f0, f1, t) {
    return t < 0.5 ? f0 : f1;
}

/**
 * Catmull-Rom スプライン補間
 */
export function catmullRom(f0, f1, f2, f3, t) {
    const t2 = t * t;
    const t3 = t2 * t;

    // 標準的なCatmull-Romの係数計算 (tension = 0.5)
    return 0.5 * (
        (2 * f1) +
        (-f0 + f2) * t +
        (2 * f0 - 5 * f1 + 4 * f2 - f3) * t2 +
        (-f0 + 3 * f1 - 3 * f2 + f3) * t3
    );
}

/**
 * 単調Catmull-Romスプライン補間 (Monotonic Catmull-Rom)
 */
export function monotonicCatmullRom(f0, f1, f2, f3, t) {
    let d1 = 0.5 * (f2 - f0);
    let d2 = 0.5 * (f3 - f1);
    const delta = f2 - f1;

    if (Math.abs(delta) < 1e-5) {
        d1 = 0;
        d2 = 0;
    } else {
        const a = d1 / delta;
        const b = d2 / delta;
        if (a * a + b * b > 9.0) {
            const aux = 3.0 / Math.sqrt(a * a + b * b);
            d1 = aux * a * delta;
            d2 = aux * b * delta;
        }
    }

    const t2 = t * t;
    const t3 = t2 * t;

    // 3次エルミート補間
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    return h00 * f1 + h10 * d1 + h01 * f2 + h11 * d2;
}

/**
 * バリセントリック（重心座標・インデックス）計算
 * C++のポインタ引数を受け渡す代わりにオブジェクトで返します
 */
export function getBarycentric(x, iLow, iHigh) {
    const s = Math.floor(x);
    let i = Math.max(iLow, Math.min(iHigh - 1, s));
    let t = x - Math.floor(x); // または適切なオフセット

    if (i === iHigh) {
        i = iHigh - 1;
        t = 1.0;
    }
    return { i, t };
}
