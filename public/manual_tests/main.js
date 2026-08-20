document.addEventListener("DOMContentLoaded", async () => {
  const selectElement = document.getElementById("sample-select")
  const iframeElement = document.getElementById("sample-frame")

  try {
    const response = await fetch("samples.json")
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const samples = await response.json()

    // セレクトボックスに選択肢を追加
    samples.forEach((sample) => {
      const option = document.createElement("option")
      // filename には "08_mathutils/08.html" のようなパスが入る想定
      option.value = sample.filename
      option.textContent = sample.title
      selectElement.appendChild(option)
    })

    // ドロップダウン変更時のイベント
    selectElement.addEventListener("change", (event) => {
      const path = event.target.value
      if (path) {
        // 相対パスとして iframe に適用
        iframeElement.src = path
      } else {
        iframeElement.src = "about:blank"
      }
    })
  } catch (error) {
    console.error("データの読み込みに失敗しました:", error)
  }
})
