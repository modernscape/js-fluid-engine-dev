document.addEventListener("DOMContentLoaded", async () => {
  const selectElement = document.getElementById("sample-select")
  const iframeElement = document.getElementById("sample-frame")

  try {
    // samples.json を取得
    const response = await fetch("samples.json")
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const samples = await response.json()

    // セレクトボックスに選択肢を追加
    samples.forEach((sample) => {
      const option = document.createElement("option")
      option.value = sample.filename + ".html"
      option.textContent = sample.title
      selectElement.appendChild(option)
    })

    // ドロップダウン変更時のイベント
    selectElement.addEventListener("change", (event) => {
      const filename = event.target.value
      if (filename) {
        iframeElement.src = filename
      } else {
        iframeElement.src = "about:blank"
      }
    })

    // 必要に応じて最初のアイテムを初期選択にする場合：
    // if (samples.length > 0) {
    //     selectElement.value = samples[0].filename;
    //     iframeElement.src = samples[0].filename;
    // }
  } catch (error) {
    console.error("samples.json の読み込みに失敗しました:", error)
    const option = document.createElement("option")
    option.value = ""
    option.textContent = "読み込みエラー"
    selectElement.appendChild(option)
  }
})
