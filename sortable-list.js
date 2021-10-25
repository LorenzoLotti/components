const sortableLists = document.querySelectorAll('.sortable-list')

document.head.insertAdjacentElement(
  'afterbegin',
  document.createElement('style')
).textContent = /*css*/`
  :root.grabbing, :root.grabbing * {
    cursor: grabbing;
  }

  .sortable-list {
    box-sizing: content-box !important;
    list-style-position: inside;
    position: relative;
    user-select: none;
    padding: 0;
  }

  .sortable-list > li {
    box-sizing: content-box !important;
    cursor: grab;
  }

  .sortable-list > li.grabbing {
    position: absolute !important;
    top: var(--y) !important;
    left: 0;
    right: 0;
    z-index: 1;
  }

  .sortable-list > li.hole {
    list-style-type: none !important;
    display: none;
    min-width: var(--li-width) !important;
    min-height: var(--li-height) !important;
    overflow: hidden;
    padding: 0 !important;
  }

  .sortable-list > li.hole.visible {
    display: block;
  }
`

for (const sortableList of sortableLists)
{
  const origin = [ ]
  const lis = sortableList.querySelectorAll(':scope > li')

  try
  {
    lis[0].classList.add('first')
  }
  catch
  {
    continue
  }

  const hole = sortableList.insertAdjacentElement('afterbegin', document.createElement('li'))
  hole.classList.add('hole')

  sortableList.toArray = (check = false) =>
  {
    const result = [ ]

    for (const li of sortableList.querySelectorAll(':scope > li:not(.hole)'))
      result.push(li.getAttribute('data-value') ?? li.textContent)

    return check && !sameItems(origin, result) ? null : result
  }

  for (const li of lis)
  {
    let onMouseMove, onMouseUp, moved = false
    origin.push(li.getAttribute('data-value') ?? li.textContent);

    li.onmousedown = li.ontouchstart = e =>
    {
      e.preventDefault();

      if (!e.defaultPrevented)
        return

      document.documentElement.classList.add('grabbing')
      hole.style.setProperty('--li-width', li.clientWidth + 'px')
      hole.style.setProperty('--li-height', li.clientHeight + 'px')
      li.classList.add('grabbing')
      hole.classList.add('visible')

      addEventListener('mousemove', onMouseMove = (e, moving = true) =>
      {
        e.pageY ??= e.touches[0].pageY
        const y = e.pageY - li.offsetHeight / 2 - sortableList.offsetTop
        let first = true
        moved = moving

        li.style.setProperty(
          '--y',
          Math.min(Math.max(y, 0), sortableList.clientHeight - li.offsetHeight) + 'px'
        )

        for (const sibiling of sortableList.querySelectorAll(':scope > li:not(.hole)'))
        {
          sibiling.classList.remove('first')

          if (sibiling != li)
          {
            if (first)
            {
              first = false
              sibiling.classList.add('first')
            }

            if (y < sibiling.offsetTop)
            {
              if (hole.nextElementSibling != sibiling)
                sortableList.insertBefore(hole, sibiling)

              return
            }
          }
        }

        sortableList.insertAdjacentElement('beforeend', hole)
      })

      addEventListener('touchmove', onMouseMove)
      onMouseMove(e, false)
    }

    addEventListener('mouseup', onMouseUp = () =>
    {
      if (li.classList.contains('grabbing'))
      {
        removeEventListener('mousemove', onMouseMove)
        removeEventListener('touchmove', onMouseMove)
        hole.classList.remove('visible')
        li.style.removeProperty('--y')
        li.classList.remove('grabbing')
        document.documentElement.classList.remove('grabbing')

        if (moved)
          sortableList.insertBefore(li, hole)

        moved = false
        sortableList.querySelector(':scope > li.first').classList.remove('first')
        sortableList.querySelector(':scope > li:not(.hole)').classList.add('first')
      }
    })

    addEventListener('touchend', onMouseUp)

    addEventListener('touchcancel', () =>
    {
      moved = false
      onMouseUp()
    })
  }
}

function sameItems(array1, array2)
{
  if (array1.length != array2.length)
    return false

  for (const item of array1)
    if (!array2.includes(item))
      return false

  return true
}
