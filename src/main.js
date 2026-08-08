import samplesConfig from "./samples.json"

const canvas = document.getElementById("simulationCanvas")
const selector = document.getElementById("sampleSelector")

let currentSample = null

// 1. JSONを基にセレクトボックスの <option> を自動生成
function initSelector() {
  samplesConfig.forEach((sample) => {
    const option = document.createElement("option")
    option.value = sample.id
    option.textContent = sample.title
    selector.appendChild(option)
  })
}

// 2. 選択されたサンプルを動的に読み込んで実行
async function loadSample(id) {
  if (currentSample) {
    currentSample.stop()
  }

  // 該当するサンプルの設定をJSONから探す
  const sampleMeta = samplesConfig.find((s) => s.id === id)
  if (!sampleMeta) return

  try {
    // 動的インポートで対応するJSファイルを読み込む
    const module = await import(/* @vite-ignore */ sampleMeta.path)
    const SampleClass = module[sampleMeta.className]

    if (SampleClass) {
      currentSample = new SampleClass(canvas)
      currentSample.start()
    } else {
      console.error(
        `Class ${sampleMeta.className} not found in ${sampleMeta.path}`,
      )
    }
  } catch (err) {
    console.error(`Failed to load sample: ${id}`, err)
  }
}

// 初期化とイベントリスナーの設定
initSelector()
loadSample(selector.value)

selector.addEventListener("change", (e) => {
  loadSample(e.target.value)
})
