import samplesConfig from "./samples.json"

const canvas = document.getElementById("simulationCanvas")
const selector = document.getElementById("sampleSelector")

let currentSample = null
const STORAGE_KEY = "selected_fluid_sample"

// Viteの機能で samples フォルダ内のすべての .js ファイルを事前にマップする
const sampleModules = import.meta.glob("./samples/**/*.js")

function initSelector() {
  samplesConfig.forEach((sample) => {
    const option = document.createElement("option")
    option.value = sample.id
    option.textContent = sample.title
    selector.appendChild(option)
  })

  const savedSampleId = localStorage.getItem(STORAGE_KEY)
  if (savedSampleId) {
    const exists = samplesConfig.some((s) => s.id === savedSampleId)
    if (exists) {
      selector.value = savedSampleId
    }
  }
}

async function loadSample(id) {
  if (currentSample) {
    currentSample.stop()
  }

  const sampleMeta = samplesConfig.find((s) => s.id === id)
  if (!sampleMeta) return

  // --- ここに追加 ---
  const msgDiv = document.getElementById("msg")
  if (msgDiv) {
    msgDiv.innerHTML = sampleMeta.description || ""
  }

  try {
    // Viteのマップから該当するファイルのパスを構築
    const filePath = `./samples/${sampleMeta.filename}`
    const importer = sampleModules[filePath]

    if (!importer) {
      throw new Error(`Sample file not found in glob map: ${filePath}`)
    }

    if (filePath === "./samples/01-wave-propagation.js") {
      if (!document.getElementById("wave-check")) {
        const waveCheck = document.createElement("div")
        waveCheck.id = "wave-check"
        waveCheck.innerHTML = `
          <label><input type="checkbox" id="toggleWaveA" checked /> 波A</label>
          <label><input type="checkbox" id="toggleWaveB" /> 波B</label>
          <label><input type="checkbox" id="toggleWaveC" /> 波C</label>
        `
        document.body.appendChild(waveCheck)
      }
    } else {
      document.getElementById("wave-check")?.remove()
    }

    const module = await importer()
    const SampleClass = module[sampleMeta.className]

    if (SampleClass) {
      currentSample = new SampleClass(canvas)
      currentSample.start()
    } else {
      console.error(
        `Class ${sampleMeta.className} not found in ${sampleMeta.filename}`,
      )
    }
  } catch (err) {
    console.error(`Failed to load sample: ${id}`, err)
  }
}

initSelector()
loadSample(selector.value)

selector.addEventListener("change", (e) => {
  const selectedId = e.target.value
  localStorage.setItem(STORAGE_KEY, selectedId)
  loadSample(selectedId)
})
