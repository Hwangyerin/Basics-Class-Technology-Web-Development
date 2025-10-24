console.log(document.getElementById('plant1'));
dragElement(document.getElementById('plant1'));
dragElement(document.getElementById('plant2'));
dragElement(document.getElementById('plant3'));
dragElement(document.getElementById('plant4'));
dragElement(document.getElementById('plant5'));
dragElement(document.getElementById('plant6'));
dragElement(document.getElementById('plant7'));
dragElement(document.getElementById('plant8'));
dragElement(document.getElementById('plant9'));
dragElement(document.getElementById('plant10'));
dragElement(document.getElementById('plant11'));
dragElement(document.getElementById('plant12'));
dragElement(document.getElementById('plant13'));
dragElement(document.getElementById('plant14'));

let highestZ = 100; // jar보다 위에 있도록 넉넉히 시작

function dragElement(terrariumElement) {
  let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;

  terrariumElement.onpointerdown = pointerDrag;

  // 🌿 더블클릭하면 맨 위로
  terrariumElement.ondblclick = function () {
    bringToFront();
  };

  function pointerDrag(e) {
    e.preventDefault();
    // 클릭 시 바로 z-index 올려주면 드래그 중에도 위로 올라옴
    bringToFront();

    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onpointermove = elementDrag;
    document.onpointerup = stopElementDrag;
  }

  function elementDrag(e) {
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    terrariumElement.style.position = "absolute";
    terrariumElement.style.top = terrariumElement.offsetTop - pos2 + "px";
    terrariumElement.style.left = terrariumElement.offsetLeft - pos1 + "px";
  }

  function stopElementDrag() {
    document.onpointerup = null;
    document.onpointermove = null;

    bringToFront();
  }

  function bringToFront() {
    highestZ++;
    terrariumElement.style.zIndex = highestZ;
  }
}
