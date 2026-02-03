/**
 * Helper to generate HTML templates for Puppeteer's displayHeaderFooter option.
 */

export const generateHeaderTemplate = (data) => {
    const { headerImg } = data;

    return `
        <div style="width: 100%; padding: 5px 40px; font-family: 'Arial', sans-serif;">
            <style>
                .header-logo { width: 100%; display: block; }
                .fallback-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 15px; }
                .logo-section { display: flex; align-items: center; gap: 12px; }
                .logo { width: 70px; height: 70px; }
                .company-name { display: flex; flex-direction: column; line-height: 1; }
                .name-life { color: #d32f2f; font-family: 'Arial Black', sans-serif; font-size: 28px; font-weight: 900; }
                .name-diagnostic { color: #1565c0; font-family: 'Arial Black', sans-serif; font-size: 18px; margin-top: 2px; }
                .header-info { text-align: right; max-width: 280px; }
                .header-info h2 { margin: 0 0 6px 0; font-size: 13px; color: #1565c0; font-weight: bold; font-family: Arial, sans-serif; }
                .header-bullets { list-style: none; padding: 0; font-size: 9px; line-height: 1.6; }
                .header-bullets li { position: relative; margin-bottom: 2px; color: #263238; }
            </style>
            ${headerImg ? `
                <img src="${headerImg}" class="header-logo" />
            ` : `
                <div class="fallback-header">
                    <div class="logo-section">
                        <div class="company-name">
                            <h1 class="name-life">Life Care</h1>
                            <h1 class="name-diagnostic">Diagnostic</h1>
                        </div>
                    </div>
                    <div class="header-info">
                        <h2>Clinical Laboratory</h2>
                        <ul class="header-bullets">
                            <li style="display: flex; align-items: center;"><span style="color: #d32f2f; margin-right: 4px;">●</span> Fully Automated Computerized Clinical Lab</li>
                            <li style="display: flex; align-items: center;"><span style="color: #d32f2f; margin-right: 4px;">●</span> Health Check up for company ● ECG</li>
                            <li style="display: flex; align-items: center;"><span style="color: #d32f2f; margin-right: 4px;">●</span> Home Visit ● Sunday Open</li>
                        </ul>
                    </div>
                </div>
            `}
        </div>
    `;
};

export const generateFooterTemplate = (data) => {
    const { footerStamp, isoMark, footerImg } = data;

    return `
        <div style="width: 100%; padding: 0 40px 10px; font-family: 'Arial', sans-serif;">
            <style>
                .sig-box { text-align: center; width: 180px; }
                .sig-name { font-weight: bold; font-size: 11px; margin-bottom: 3px; color: #000; }
                .sig-title { color: #263238; font-size: 9px; line-height: 1.4; font-weight: bold; }
            </style>
            <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                <!-- Signatures Row -->
                <div style="display: flex; justify-content: center; align-items: flex-end; width: 100%; margin-bottom: 10px;">
                    <!-- Left Signature -->
                    <div class="sig-box" style="text-align: right; margin-right: 40px;">
                        <div class="sig-name">Mrs. Trupti Patil</div>
                        <div class="sig-title">M.SC. ADMLT. (Mum)</div>
                        <div class="sig-title">Lab. Technician</div>
                    </div>

                    <!-- Center Stamp -->
                    ${footerStamp ? `
                        <div style="display: flex; justify-content: center;">
                            <img src="${footerStamp}" style="height: 60px;" />
                        </div>
                    ` : '<div style="width: 80px;"></div>'}

                    <!-- Right Signature -->
                    <div class="sig-box" style="text-align: left; margin-left: 40px;">
                        <div class="sig-name">Dr. A. Muloy</div>
                        <div class="sig-title">(MD. (Pathology))</div>
                        <div class="sig-title">Reg. No 2019/03/11113</div>
                    </div>
                </div>

                <!-- ISO Mark -->
                ${isoMark ? `
                    <div style="margin: 5px 0;">
                        <img src="${isoMark}" style="height: 70px;" />
                    </div>
                ` : ''}

                <!-- Footer Address Image -->
                ${footerImg ? `
                    <div style="width: 100%;">
                        <img src="${footerImg}" style="width: 100%; display: block;" />
                    </div>
                ` : ''}
            </div>
            <div style="text-align: right; font-size: 7px; color: #666; width: 100%;">
                Page <span class="pageNumber"></span> of <span class="totalPages"></span>
            </div>
        </div>
    `;
};
