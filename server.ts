import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

// Healthcheck endpoint for instant ping and keepalive
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Initialize Google GenAI with recommended telemetry headers
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

/**
 * Robust, low-latency Gemini generation helper with automatic retry and model fallback.
 * Prevents 503 UNAVAILABLE / demand spikes from breaking the user experience.
 */
async function generateWithFastFallback(
  contents: any,
  systemInstruction?: string,
  primaryModel: string = 'gemini-3.8-flash'
): Promise<string> {
  if (!ai) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY trên máy chủ.');
  }

  // Model fallback cascade: primary -> flash-lite -> flash-latest
  const modelCascade = [
    primaryModel,
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];

  let lastError: any = null;

  for (const model of modelCascade) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const config: any = {
          responseMimeType: 'application/json',
        };

        if (systemInstruction) {
          config.systemInstruction = systemInstruction;
        }

        // Apply fast thinking level to drastically reduce latency and avoid timeout
        if (model.includes('3.8-flash')) {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        } else if (model.includes('3.1-flash-lite')) {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
        }

        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });

        const rawText = response.text || '';
        if (rawText.trim()) {
          return rawText;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isSpikeOrRateLimit =
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED');

        console.warn(`[Gemini API] Lỗi model ${model} (lần ${attempt + 1}):`, errMsg.slice(0, 160));

        // If it's a 503 or 429 spike, wait briefly and either retry or immediately switch model
        if (isSpikeOrRateLimit) {
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 600));
            continue;
          }
          // On second attempt, jump immediately to the next fallback model
          break;
        } else {
          // If it's a bad request or non-retryable error, don't loop endlessly
          break;
        }
      }
    }
  }

  // If all models failed, sanitize error message for user
  const sanitizedMsg = lastError?.message || 'Máy chủ AI tạm thời bận';
  if (sanitizedMsg.includes('503') || sanitizedMsg.includes('high demand')) {
    throw new Error('Hệ thống AI đang quá tải trong giây lát. Đã kích hoạt cơ chế tự động thử lại, vui lòng bấm thử lại.');
  }
  throw new Error(sanitizedMsg);
}

/**
 * Safely parse JSON from Gemini text response, stripping markdown wrappers if present
 */
function cleanAndParseJSON(text: string, defaultValue: any = {}): any {
  if (!text) return defaultValue;
  try {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(clean);
  } catch (e) {
    console.error('Failed to parse JSON response:', text.slice(0, 200));
    return defaultValue;
  }
}

// ==========================================
// API 1: Đọc hoá đơn & biên lai đơn / đa giao dịch
// ==========================================
app.post('/api/gemini/parse-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', currentDate, categoryList } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Thiếu dữ liệu ảnh base64' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên server. Bạn vẫn có thể nhập tay số tiền.',
      });
    }

    const currentYear = (currentDate || '2026').slice(0, 4);

    const prompt = `Bạn là chuyên gia nhận diện hoá đơn và giao dịch tài chính tại Việt Nam.
Ảnh đính kèm là một trong các loại sau:
1. Hoá đơn/biên lai bán lẻ giấy, biên lai thanh toán (nhà hàng, siêu thị, cây xăng, quán cafe...)
2. Danh sách đơn hàng Shopee ("Đơn đã mua", "Chờ giao hàng", ShopeeFood)
3. Danh sách hoạt động Grab ("Hoạt động gần đây", GrabFood, GrabCar)
4. Ảnh chụp màn hình chuyển khoản hoặc thông báo số dư ngân hàng (Vietcombank, Techcombank, MB, VPBank, MoMo...).

Hôm nay là ${currentDate || new Date().toISOString().slice(0, 10)}. Năm hiện tại là ${currentYear}.

Danh mục phân loại:
${categoryList || `CHI TIÊU:
- an_uong: Ăn uống nhà hàng, quán ăn, GrabFood, ShopeeFood
- cho_sieu_thi: Mua sắm thực phẩm siêu thị, WinMart, Co.opmart, Bách Hoá Xanh, chợ truyền thống
- di_lai: Xăng xe, GrabCar, GrabBike, vé xe, gửi xe, cầu đường
- nha_o: Tiền thuê nhà, điện, nước, internet, đồ gia dụng, sửa nhà
- suc_khoe: Khám chữa bệnh, thuốc men, bệnh viện, nha khoa
- giao_duc: Học phí, khoá học, sách vở
- cafe: Cà phê Phúc Long, Highlands, trà sữa, đồ uống giải khát
- mua_sam: Quần áo, mỹ phẩm, đồ online Shopee, Lazada, TikTok Shop
- giai_tri: Xem phim, du lịch, xem phim rạp, game
- hieu_hi: Đám cưới, sinh nhật, thăm hỏi
- tiet_kiem: Gửi tiết kiệm, trả nợ thẻ tín dụng
- khac: Chi tiêu khác không thuộc các nhóm trên.
THU NHẬP:
- luong: Tiền lương chuyển khoản hàng tháng
- thuong: Thưởng dự án, thưởng Tết, hoa hồng
- thu_phu: Làm thêm, freelance, bán hàng ngoài
- loi_dau_tu: Cổ tức, lãi tiết kiệm, lợi nhuận Sinh lời tự động Techcombank
- thu_khac: Tiền người khác chuyển trả nợ, quà tặng.`}

Yêu cầu bóc tách:
1. Nếu ảnh có NHIỀU đơn hoặc NHIỀU dòng giao dịch (Shopee, Grab, sao kê ngân hàng):
   - Đặt "isMulti": true
   - Bóc tách đầy đủ tất cả các đơn thành công vào mảng "transactions".
   - Bỏ qua các đơn bị huỷ ("Đã huỷ", "Không thể đặt đơn").
   - Shopee: Lấy số tiền thực trả ("Tổng số tiền: ...đ"), merchant là "Shopee - " + tên Shop.
   - Grab: Lấy tên quán và số tiền, phân loại "an_uong" hoặc "di_lai".
2. Nếu là hoá đơn đơn lẻ hoặc chuyển khoản đơn lẻ:
   - "isMulti": false
   - Lấy đúng tổng số tiền cuối cùng (loại bỏ thuế/phí phụ nếu đã gộp, lấy số tiền thực trả).
   - "type": "out" (chi tiền) hoặc "in" (nhận tiền).
   - "merchant": Tên cửa hàng, nhà xe, quán ăn hoặc người nhận.
   - "note": Tóm tắt món chính hoặc nội dung chuyển khoản.
   - "items": Danh sách món (nếu có trên hoá đơn giấy).
   - "amount": Số nguyên VND dương.

Trả về duy nhất JSON object theo cấu trúc:
{
  "isMulti": boolean,
  "statementName": string,
  "type": "out" | "in" | "transfer",
  "amount": number,
  "date": "YYYY-MM-DD",
  "cat": string,
  "merchant": string,
  "note": string,
  "items": [{"name": string, "amount": number}],
  "confidence": "cao" | "trung bình",
  "transactions": [
    {
      "id": "tx_1",
      "type": "out" | "in" | "transfer",
      "isCreditPayment": boolean,
      "amount": number,
      "date": "YYYY-MM-DD",
      "cat": string,
      "merchant": string,
      "note": string,
      "confidence": "cao"
    }
  ]
}`;

    const rawResponse = await generateWithFastFallback(
      [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
      'Bạn là trợ lý nhận diện hoá đơn tài chính tiếng Việt siêu tốc, phản hồi nhanh và chính xác dưới dạng JSON thuần tuý.',
      'gemini-3.8-flash'
    );

    const parsed = cleanAndParseJSON(rawResponse, {
      isMulti: false,
      type: 'out',
      amount: 0,
      date: currentDate || new Date().toISOString().slice(0, 10),
      cat: 'khac',
      note: 'Hoá đơn',
      items: [],
      confidence: 'trung bình',
    });

    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/gemini/parse-receipt:', error);
    const userMessage =
      error?.message && !error.message.includes('{')
        ? error.message
        : 'Hệ thống AI đang xử lý lượt tải cao. Vui lòng thử lại với ảnh rõ hơn hoặc nhập tay số tiền.';
    return res.status(500).json({ error: userMessage });
  }
});

// ==========================================
// API 2: Quét sao kê ngân hàng & lịch sử nhiều dòng (Batch)
// ==========================================
app.post('/api/gemini/parse-statement', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', currentDate, categoryList } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Thiếu dữ liệu ảnh sao kê' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên server. Bạn vẫn có thể chọn mẫu thử hoặc nhập tay.',
      });
    }

    const currentYear = (currentDate || '2026').slice(0, 4);

    const prompt = `Bạn là hệ thống OCR sao kê ngân hàng và lịch sử giao dịch chuyên nghiệp cho người dùng Việt Nam.
Nhiệm vụ: Trích xuất TOÀN BỘ các dòng giao dịch xuất hiện trong ảnh mà KHÔNG BỎ SÓT DÒNG NÀO (từ trên xuống dưới).

Ảnh đính kèm có thể là:
- Sao kê hoặc màn hình "Lịch sử giao dịch", "Biến động số dư" của app ngân hàng: Techcombank (kể cả Lợi nhuận Sinh lời tự động), Vietcombank, MB Bank, VPBank, ACB, BIDV, VietinBank, TPBank, Timo, Cake, OCB, Sacombank, VIB, Shinhan...
- Ví điện tử: MoMo, ZaloPay, ShopeePay, Viettel Money, VNPay...
- Lịch sử mua hàng: Shopee ("Đơn đã mua"), TikTok Shop, Grab ("Hoạt động").

Hôm nay là: ${currentDate || new Date().toISOString().slice(0, 10)}. Năm hiện tại: ${currentYear}.

${categoryList || `MÃ DANH MỤC:
CHI: an_uong, cho_sieu_thi, di_lai, nha_o, suc_khoe, giao_duc, cafe, mua_sam, giai_tri, hieu_hi, tiet_kiem, khac.
THU: luong, thuong, thu_phu, loi_dau_tu, thu_khac.`}

QUY TẮC NHẬN DIỆN CHI TIẾT CHO TỪNG DÒNG:
1. Chi tiêu (type = "out"):
   - Số tiền có dấu trừ "-" hoặc màu đỏ/đen, nội dung thanh toán hoặc chuyển tiền đi.
   - Ví dụ: "- 283,000" (Nap ví MoMo), "- 392,436" (CTCP Bệnh Viện Đông Đô -> cat: "suc_khoe"), "- 575,000" (Nông Đức Minh -> cat: "khac").
2. Thu nhập (type = "in"):
   - Số tiền có dấu cộng "+" hoặc màu xanh lá, nội dung nhận tiền chuyển khoản đến hoặc lương, lãi.
   - Ví dụ: "+ 8,415" (Lợi nhuận Sinh lời tự động Techcombank -> cat: "loi_dau_tu", amount: 8415), "+ 28,000,000" (Chuyen luong -> cat: "luong").
3. Trả nợ thẻ tín dụng / Chuyển khoản nội bộ (type = "transfer"):
   - Nếu nội dung có chữ "Thanh toan no the tin dung", "Thanh toan the", "Tra no the VPBank/HSBC/Techcombank":
     -> Đánh dấu: type = "transfer", isCreditPayment = true, cat = "tiet_kiem".
4. Shopee / Grab:
   - Tách từng đơn hàng riêng biệt.
   - Shopee: merchant = "Shopee - " + tên Shop, cat = "mua_sam", amount = số tiền thực trả.
   - Grab: merchant = "Grab - " + tên quán / chuyến xe, cat = "an_uong" hoặc "di_lai". Bỏ qua đơn bị huỷ.
5. amount: Luôn là SỐ NGUYÊN DƯƠNG VND (bỏ dấu cộng/trừ/chấm/phẩy/chữ đ).
6. note: Giữ đầy đủ nội dung chuyển khoản / tên người gửi / người nhận để người dùng kiểm tra rõ ràng.
7. date: Định dạng YYYY-MM-DD. Nếu trên ảnh chỉ có ngày/tháng (ví dụ 05/11), hãy ghép với năm hiện tại ${currentYear}.

BẮT BUỘC: Hãy trích xuất tất cả các dòng giao dịch nhìn thấy được, xếp theo thứ tự hiển thị từ trên xuống dưới.

Trả về định dạng JSON thuần tuý:
{
  "statementName": "Tên ngân hàng hoặc dịch vụ (VD: Sao kê Techcombank, Shopee, Grab...)",
  "totalTransactionsFound": number,
  "totalIncome": number,
  "totalExpense": number,
  "transactions": [
    {
      "id": "stmt_1",
      "type": "out" | "in" | "transfer",
      "isCreditPayment": boolean,
      "amount": number,
      "date": "YYYY-MM-DD",
      "cat": string,
      "merchant": string,
      "note": string,
      "confidence": "cao"
    }
  ]
}`;

    const rawResponse = await generateWithFastFallback(
      [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
      'Bạn là trợ lý quét sao kê ngân hàng tự động cho người Việt Nam, phản hồi cực nhanh dạng JSON thuần.',
      'gemini-3.8-flash'
    );

    const parsed = cleanAndParseJSON(rawResponse, {
      statementName: 'Sao kê ngân hàng',
      totalTransactionsFound: 0,
      totalIncome: 0,
      totalExpense: 0,
      transactions: [],
    });

    // Ensure transactions is always a valid array
    if (!Array.isArray(parsed.transactions)) {
      parsed.transactions = [];
    }
    parsed.totalTransactionsFound = parsed.transactions.length;

    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/gemini/parse-statement:', error);
    const userMessage =
      error?.message && !error.message.includes('{')
        ? error.message
        : 'Máy chủ AI đang có lượng yêu cầu lớn. Vui lòng bấm thử lại với ảnh rõ hơn hoặc dùng mẫu thử.';
    return res.status(500).json({ error: userMessage });
  }
});

// ==========================================
// API 3: Phân tích câu gõ nhanh (Quick Input NLP)
// ==========================================
app.post('/api/gemini/quick-input', async (req, res) => {
  try {
    const { text: userInput, currentDate, categoryList } = req.body;

    if (!userInput || !userInput.trim()) {
      return res.status(400).json({ error: 'Nội dung nhập trống' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên server.',
      });
    }

    const today = currentDate || new Date().toISOString().slice(0, 10);
    const dayOfWeek = new Date().toLocaleDateString('vi-VN', { weekday: 'long' });

    const prompt = `Chuyển câu ghi chép thu chi tiếng Việt thành giao dịch. Hôm nay là ${today} (${dayOfWeek}).
${categoryList || `CHI: an_uong, cho_sieu_thi, di_lai, nha_o, suc_khoe, giao_duc, cafe, mua_sam, giai_tri, hieu_hi, tiet_kiem, khac.
THU: luong, thuong, thu_phu, loi_dau_tu, thu_khac.`}
Quy tắc tiếng Việt: 'k' = nghìn; 'tr', 'củ', 'triệu' = triệu đồng. Quy 'hôm qua', 'hôm kia', 'thứ 2'… ra ngày YYYY-MM-DD.
Câu của người dùng: "${userInput}".
Chỉ trả lời JSON:
{"type": "out"|"in", "amount": number, "date": "YYYY-MM-DD", "cat": string, "merchant": string, "note": string, "items": [], "confidence": "cao"}`;

    const rawResponse = await generateWithFastFallback(
      [{ role: 'user', parts: [{ text: prompt }] }],
      'Bạn là trợ lý xử lý ngôn ngữ tự nhiên tiếng Việt cho ứng dụng thu chi cá nhân.',
      'gemini-3.8-flash'
    );

    const parsed = cleanAndParseJSON(rawResponse, {
      type: 'out',
      amount: 0,
      date: today,
      cat: 'khac',
      merchant: '',
      note: userInput,
      items: [],
      confidence: 'trung bình',
    });

    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/gemini/quick-input:', error);
    return res.status(500).json({
      error: 'Không thể phân tích câu gõ nhanh qua AI. Đang chuyển sang bộ phân tích tích hợp sẵn.',
    });
  }
});

// ==========================================
// API 4: Báo cáo & Cố vấn tài chính AI
// ==========================================
app.post('/api/gemini/financial-advisor', async (req, res) => {
  try {
    const {
      monthlyBudget,
      financialGoal,
      riskAppetite,
      threeMonthsData,
      largestExpenses,
      isSampleData,
    } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên server.',
      });
    }

    const prompt = `Bạn là cố vấn tài chính cá nhân cao cấp cho người đi làm tại Việt Nam. Viết tiếng Việt thực tế, ấm áp, thẳng thắn, đưa ra số liệu VND cụ thể.
Thông tin người dùng:
- Ngân sách chi mong muốn: ${monthlyBudget || 0} VND/tháng
- Mục tiêu tài chính: ${financialGoal || 'Tự do tài chính và có quỹ tiết kiệm'}
- Khẩu vị rủi ro: ${riskAppetite || 'Trung bình'}
${isSampleData ? 'LƯU Ý: Đây là dữ liệu ví dụ minh hoạ.' : ''}
Dữ liệu 3 tháng gần nhất: ${JSON.stringify(threeMonthsData || {})}.
Các khoản chi lớn nhất tháng này: ${JSON.stringify(largestExpenses || [])}.

Yêu cầu phân tích:
1. Đánh giá theo quy tắc 50/30/20 và so sánh với tháng trước; chỉ ra khoản chi bất thường và các khoản chi rò rỉ (cafe, trà sữa, mua sắm online vặt...).
2. 3–5 gợi ý tiết kiệm thực tế, mỗi gợi ý có số tiền ước tính tiết kiệm được mỗi tháng (tiet_kiem_thang).
3. Đề xuất phân bổ tiền dư hằng tháng theo thứ tự ưu tiên tài chính cá nhân ở Việt Nam:
   - Quỹ dự phòng khẩn cấp 3–6 tháng chi tiêu
   - Tiền gửi tiết kiệm ngân hàng kỳ hạn linh hoạt
   - Chứng chỉ quỹ mở (cổ phiếu/trái phiếu), ETF VN30 tích sản
   - Vàng nhẫn 9999 tỷ trọng nhỏ phòng thủ.
   (Không nêu mã cổ phiếu cụ thể, không cam kết lợi nhuận).
4. Điểm sức khoẻ tài chính từ 0 đến 100.

Chỉ trả về JSON:
{
  "tom_tat": string,
  "diem_suc_khoe": number,
  "canh_bao": [string],
  "goi_y_tiet_kiem": [{"tieu_de": string, "chi_tiet": string, "tiet_kiem_thang": number}],
  "tien_du_du_kien_thang": number,
  "phan_bo_dau_tu": [{"kenh": string, "ty_le": number, "ly_do": string}],
  "buoc_tiep_theo": [string]
}`;

    const rawResponse = await generateWithFastFallback(
      [{ role: 'user', parts: [{ text: prompt }] }],
      'Bạn là cố vấn tài chính cá nhân tiếng Việt đưa ra lời khuyên thực tế dưới dạng JSON chuẩn.',
      'gemini-3.8-flash'
    );

    const parsed = cleanAndParseJSON(rawResponse, {});
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/gemini/financial-advisor:', error);
    return res.status(500).json({
      error: 'Không thể tạo báo cáo tài chính AI trực tuyến lúc này. Sẽ dùng phân tích nội bộ.',
    });
  }
});

// Setup Vite middlewares for development or serve dist in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
