const getSarduDesktopHardware = () => (
    typeof window === 'undefined' ? null : window.sarduEduDesktop?.hardware || null
);

export default getSarduDesktopHardware;
