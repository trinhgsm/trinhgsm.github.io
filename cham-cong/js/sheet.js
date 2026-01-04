// Mobile Responsive Sheet Configuration
(function() {
  'use strict';

  // Detect if device is mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth < 768;
  };

  // Initialize responsive sheet
  function initResponsiveSheet() {
    const sheet = document.querySelector('.sheet-container') || document.body;
    const viewport = document.querySelector('meta[name="viewport"]');
    
    // Ensure proper viewport meta tag for mobile
    if (!viewport) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
      document.head.appendChild(meta);
    }

    // Apply responsive styles
    applyResponsiveStyles(sheet);
    
    // Initialize zoom functionality
    initZoomControls(sheet);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      applyResponsiveStyles(sheet);
    });
  }

  // Apply responsive CSS styles
  function applyResponsiveStyles(container) {
    const style = document.createElement('style');
    style.id = 'responsive-sheet-styles';
    
    // Remove existing style if present
    const existing = document.getElementById('responsive-sheet-styles');
    if (existing) {
      existing.remove();
    }

    const mobileWidth = window.innerWidth < 768 ? window.innerWidth : 'auto';
    const baseFontSize = isMobile() ? 14 : 16;

    style.textContent = `
      * {
        box-sizing: border-box;
      }

      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        overflow-x: auto;
        overflow-y: auto;
      }

      .sheet-container,
      [role="table"],
      table {
        width: 100%;
        max-width: 100%;
        margin: 0;
        padding: 0;
        border-collapse: collapse;
        font-size: ${baseFontSize}px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .sheet-wrapper {
        display: block;
        width: 100%;
        overflow-x: auto;
        overflow-y: visible;
        -webkit-overflow-scrolling: touch;
        margin: 0;
        padding: 0;
      }

      /* Mobile optimizations */
      @media (max-width: 767px) {
        .sheet-container,
        [role="table"],
        table {
          font-size: 12px;
          line-height: 1.4;
        }

        td, th {
          padding: 8px 6px;
          min-width: 60px;
          white-space: nowrap;
        }

        .row {
          display: flex;
          flex-wrap: wrap;
        }

        .cell {
          flex: 0 0 auto;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      @media (min-width: 768px) {
        .sheet-container,
        [role="table"],
        table {
          font-size: 16px;
        }

        td, th {
          padding: 12px 8px;
          min-width: 80px;
        }
      }

      /* Zoom controls */
      .zoom-controls {
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        gap: 8px;
        z-index: 1000;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .zoom-button {
        padding: 8px 12px;
        border: none;
        background: #f5f5f5;
        cursor: pointer;
        border-radius: 3px;
        font-size: 14px;
        transition: background-color 0.2s;
      }

      .zoom-button:hover {
        background: #e0e0e0;
      }

      .zoom-button:active {
        background: #d0d0d0;
      }

      .zoom-level {
        padding: 8px 12px;
        min-width: 50px;
        text-align: center;
        font-size: 14px;
        color: #666;
        background: #f9f9f9;
        border-radius: 3px;
        border: 1px solid #eee;
      }

      /* Touch-friendly adjustments */
      @media (hover: none) and (pointer: coarse) {
        .zoom-button {
          padding: 10px 14px;
          min-width: 44px;
          min-height: 44px;
        }

        .zoom-controls {
          bottom: 30px;
          right: 30px;
        }
      }

      /* Preserve zoom transformation */
      .sheet-transform-container {
        transform-origin: 0 0;
        transition: transform 0.1s ease-out;
      }
    `;

    document.head.appendChild(style);
  }

  // Initialize zoom controls
  function initZoomControls(container) {
    // Check if zoom controls already exist
    if (document.getElementById('zoom-controls')) {
      return;
    }

    const controlsDiv = document.createElement('div');
    controlsDiv.id = 'zoom-controls';
    controlsDiv.className = 'zoom-controls';
    controlsDiv.innerHTML = `
      <button class="zoom-button" id="zoom-out" title="Zoom out">−</button>
      <div class="zoom-level" id="zoom-level">100%</div>
      <button class="zoom-button" id="zoom-in" title="Zoom in">+</button>
      <button class="zoom-button" id="zoom-reset" title="Reset zoom">Reset</button>
    `;

    document.body.appendChild(controlsDiv);

    let currentZoom = 100;
    const minZoom = 50;
    const maxZoom = 200;
    const zoomStep = 10;

    const sheetElement = container.querySelector('table') || container.querySelector('[role="table"]') || container;
    const transformContainer = createTransformContainer(sheetElement);

    // Zoom in
    document.getElementById('zoom-in').addEventListener('click', () => {
      if (currentZoom < maxZoom) {
        currentZoom += zoomStep;
        applyZoom(transformContainer, currentZoom);
      }
    });

    // Zoom out
    document.getElementById('zoom-out').addEventListener('click', () => {
      if (currentZoom > minZoom) {
        currentZoom -= zoomStep;
        applyZoom(transformContainer, currentZoom);
      }
    });

    // Reset zoom
    document.getElementById('zoom-reset').addEventListener('click', () => {
      currentZoom = 100;
      applyZoom(transformContainer, currentZoom);
    });

    // Touch pinch zoom support
    let touchStartDistance = 0;
    let touchStartZoom = currentZoom;

    document.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        touchStartDistance = getTouchDistance(e.touches[0], e.touches[1]);
        touchStartZoom = currentZoom;
      }
    }, false);

    document.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / touchStartDistance;
        currentZoom = Math.max(minZoom, Math.min(maxZoom, Math.round(touchStartZoom * scale)));
        applyZoom(transformContainer, currentZoom);
      }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        touchStartDistance = 0;
      }
    }, false);
  }

  // Create a transform container wrapper
  function createTransformContainer(element) {
    if (element.classList && element.classList.contains('sheet-transform-container')) {
      return element;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'sheet-transform-container';
    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);
    return wrapper;
  }

  // Get distance between two touch points
  function getTouchDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Apply zoom to sheet
  function applyZoom(container, zoomLevel) {
    const scale = zoomLevel / 100;
    container.style.transform = `scale(${scale})`;
    
    const zoomLevelElement = document.getElementById('zoom-level');
    if (zoomLevelElement) {
      zoomLevelElement.textContent = `${zoomLevel}%`;
    }

    // Store zoom level in sessionStorage for persistence
    sessionStorage.setItem('sheet-zoom-level', zoomLevel);
  }

  // Restore zoom level on page load
  function restoreZoomLevel() {
    const savedZoom = sessionStorage.getItem('sheet-zoom-level');
    if (savedZoom) {
      const sheetElement = document.querySelector('table') || document.querySelector('[role="table"]') || document.body;
      const transformContainer = createTransformContainer(sheetElement);
      applyZoom(transformContainer, parseInt(savedZoom, 10));
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initResponsiveSheet();
      restoreZoomLevel();
    });
  } else {
    initResponsiveSheet();
    restoreZoomLevel();
  }

  // Expose API for manual control
  window.SheetResponsive = {
    isMobile: isMobile,
    initResponsiveSheet: initResponsiveSheet,
    restoreZoomLevel: restoreZoomLevel
  };
})();
