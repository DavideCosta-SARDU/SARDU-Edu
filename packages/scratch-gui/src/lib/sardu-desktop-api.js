const getSarduDesktopHardware = () => (
    typeof window === 'undefined' ? null :
        (window.sarduBlockDesktop?.hardware || window.sarduEduDesktop?.hardware || null)
);

export default getSarduDesktopHardware;
