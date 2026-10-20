import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';

test('forwards only the image and returns file metadata', async (t) => {
  let receivedBody = '';
  const server = http.createServer((req, res) => {
    req.setEncoding('latin1');
    req.on('data', (chunk) => { receivedBody += chunk; });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        predicted_class: 'Normal',
        probabilities: { Normal: 0.8, Benign: 0.15, Malignant: 0.05 },
        malignancy_probability: 0.05,
        risk_level: 'RIESGO MUY BAJO',
      }));
    });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());

  const address = server.address();
  process.env.AI_SERVICE_URL = `http://127.0.0.1:${address.port}`;
  const { runPrediction } = await import('../src/services/predictionService.js');
  const file = {
    buffer: Buffer.from('image-content'),
    originalname: 'study.png',
    mimetype: 'image/png',
    size: 13,
  };

  const response = await runPrediction(file);

  assert.equal(response.input.filename, 'study.png');
  assert.equal(response.input.mimeType, 'image/png');
  assert.equal(response.input.sizeBytes, 13);
  assert.match(receivedBody, /name="image"/);
  assert.doesNotMatch(receivedBody, /name="(x|y|radius|bg_type)"/);
});

test('rejects unsupported files before calling the AI service', async () => {
  const { runPrediction } = await import('../src/services/predictionService.js');

  await assert.rejects(
    runPrediction({
      buffer: Buffer.from('content'),
      originalname: 'study.pdf',
      mimetype: 'application/pdf',
      size: 7,
    }),
    /Formato de imagen no soportado/,
  );
});
