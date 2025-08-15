import puppeteer from "puppeteer";
import { PDFDocument, rgb } from "pdf-lib";

export const generateChartImage = async (chartType, chartData) => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head><meta charset="UTF-8" /><title>${chartType} Chart</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  </head>
  <body>
    <canvas id="myChart" width="600" height="400"></canvas>
    <script>
      const ctx = document.getElementById('myChart').getContext('2d');
      const chart = new Chart(ctx, {
        type: '${chartType}',
        data: ${JSON.stringify(chartData)},
        options: {
          animation: {
            onComplete: () => {
              const readyDiv = document.createElement('div');
              readyDiv.id = 'chartsReady';
              readyDiv.style.display = 'none';
              document.body.appendChild(readyDiv);
            }
          }
        }
      });
    </script>
  </body>
  </html>`;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.waitForSelector("#chartsReady", { timeout: 10000 });

  const canvas = await page.$("#myChart");
  const imageBuffer = await canvas.screenshot({ type: "png" });

  await browser.close();
  return imageBuffer;
};

export const generatePdfWithChartsController = async (req, res) => {
  try {
    const chartData = {
      labels: ["Food", "Transport", "Utilities", "Entertainment"],
      datasets: [
        {
          label: "Expenses",
          data: [50, 20, 30, 40],
          backgroundColor: ["#ff6384", "#36a2eb", "#ffce56", "#4bc0c0"],
        },
      ],
    };

    // Generate chart images
    const pieChartImage = await generateChartImage("pie", chartData);
    const barChartImage = await generateChartImage("bar", chartData);

    // Create PDF and embed images
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 850]);
    const { width, height } = page.getSize();

    const pieImageEmbed = await pdfDoc.embedPng(pieChartImage);
    const barImageEmbed = await pdfDoc.embedPng(barChartImage);

    page.drawText("Monthly Expenses Charts", {
      x: 50,
      y: height - 50,
      size: 24,
      color: rgb(0, 0, 0),
    });

    const pieDims = pieImageEmbed.scale(0.5);
    page.drawImage(pieImageEmbed, {
      x: 50,
      y: height - 300,
      width: pieDims.width,
      height: pieDims.height,
    });

    const barDims = barImageEmbed.scale(0.5);
    page.drawImage(barImageEmbed, {
      x: 50,
      y: height - 600,
      width: barDims.width,
      height: barDims.height,
    });

    const pdfBytes = await pdfDoc.save();

    // Send PDF buffer as response
    res.contentType("application/pdf");
    res.send(pdfBytes);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Failed to generate PDF");
  }
};
