// 모든 식물 요소 가져오기
const plants = document.querySelectorAll('[id^="plant"]');
let highestZ = 100;

// 각 요소에 드래그 속성 및 이벤트 부여
plants.forEach(plant => {
  plant.setAttribute('draggable', 'true');

  // 드래그 시작
  plant.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', plant.id);
    plant.style.opacity = '0.5';
    bringToFront(plant);
  });

  // 드래그 종료 시
  plant.addEventListener('dragend', e => {
    plant.style.opacity = '1';
  });

  // 더블클릭 시 맨 위로 올리기
  plant.addEventListener('dblclick', () => {
    bringToFront(plant);
  });
});

document.addEventListener('dragover', e => {
  e.preventDefault(); 
});

document.addEventListener('drop', e => {
  e.preventDefault();

  const id = e.dataTransfer.getData('text/plain');
  const draggedPlant = document.getElementById(id);

  // 현재 마우스 위치로 이동
  const rect = draggedPlant.parentElement.getBoundingClientRect();
  draggedPlant.style.position = 'absolute';
  draggedPlant.style.left = e.clientX - rect.left - draggedPlant.offsetWidth / 2 + 'px';
  draggedPlant.style.top = e.clientY - rect.top - draggedPlant.offsetHeight / 2 + 'px';

  bringToFront(draggedPlant);
});


function bringToFront(element) {
  highestZ++;
  element.style.zIndex = highestZ;
}
