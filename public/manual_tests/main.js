document.addEventListener("DOMContentLoaded", async () => {
  const selectElement = document.getElementById("sample-select")
  const iframeElement = document.getElementById("sample-frame")
  const STORAGE_KEY = "selectedSample" // ローカルストレージのキー

  try {
    const response = await fetch("samples.json")
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const samples = await response.json()

    // セレクトボックスに選択肢を追加
    samples.forEach((sample) => {
      const option = document.createElement("option")
      option.value = sample.filename
      option.textContent = sample.title
      selectElement.appendChild(option)
    })

    // 1. ページ読み込み時に保存された選択状態を復元
    const savedPath = localStorage.getItem(STORAGE_KEY)
    if (savedPath) {
      // 保存されたパスが実際の選択肢に存在するか確認
      const optionExists = Array.from(selectElement.options).some(
        (option) => option.value === savedPath,
      )
      if (optionExists) {
        selectElement.value = savedPath
        iframeElement.src = savedPath
      }
    }

    // 2. ドロップダウン変更時のイベント
    selectElement.addEventListener("change", (event) => {
      const path = event.target.value
      if (path) {
        // 相対パスとして iframe に適用
        iframeElement.src = path
        // 選択された値をローカルストレージに保存
        localStorage.setItem(STORAGE_KEY, path)
      } else {
        iframeElement.src = "about:blank"
        // 未選択の場合はストレージから削除
        localStorage.removeItem(STORAGE_KEY)
      }
    })
  } catch (error) {
    console.error("データの読み込みに失敗しました:", error)
  }
})
