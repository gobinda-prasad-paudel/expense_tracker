import puppeteer from "puppeteer";
import fs from "fs";

const generateChartImage = async (chartType, chartData) => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${chartType} Chart</title>
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
              // Signal Puppeteer that rendering is done by adding #chartsReady
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

  // Wait until the #chartsReady element is added after animation complete
  await page.waitForSelector("#chartsReady", { timeout: 10000 });

  // Get the canvas element's image as a buffer (PNG)
  const canvasElement = await page.$("#myChart");
  const imageBuffer = await canvasElement.screenshot({ type: "png" });

  await browser.close();

  return imageBuffer;
};

// Usage example
(async () => {
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

  const pieImage = await generateChartImage("pie", chartData);
  const barImage = await generateChartImage("bar", chartData);

  // Save images to disk or use however you want

  fs.writeFileSync("pieChart.png", pieImage);
  fs.writeFileSync("barChart.png", barImage);

  console.log("Charts saved as images!");
})();
