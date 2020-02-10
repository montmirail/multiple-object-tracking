export const openFullscreen = () => {
  const page: any = document.documentElement;

  if (page.requestFullscreen) {
    page.requestFullscreen().then(() => console.log('fullscreen open'));
  } else if (page.mozRequestFullScreen) { /* Firefox */
    page.mozRequestFullScreen();
  } else if (page.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
    page.webkitRequestFullscreen();
  } else if (page.msRequestFullscreen) { /* IE/Edge */
    page.msRequestFullscreen();
  }
};

export const closeFullscreen = () => {
  const page: any = document.documentElement;

  if (page.exitFullscreen) {
    page.exitFullscreen();
  } else if (page.mozCancelFullScreen) { /* Firefox */
    page.mozCancelFullScreen();
  } else if (page.webkitExitFullscreen) { /* Chrome, Safari and Opera */
    page.webkitExitFullscreen();
  } else if (page.msExitFullscreen) { /* IE/Edge */
    page.msExitFullscreen();
  }
};
