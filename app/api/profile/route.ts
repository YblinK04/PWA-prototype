import { NextRequest, NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/lib/telegram-auth';// реализация проверка подписи через HMAC-SHA256 с bot token
import { z } from 'zod';


// схема того что мы ожидаем от n8n
 export const ProfileResponseSchema = z.object({
    telegram_id: z.number(),
    current_module: z.number(),
    social_level: z.number().nullable(),
    quiz_segment: z.object({
        recommended_track: z.enum(['single', 'relationship']).optional(),
        tags: z.array(z.string()).optional(),
    }).optional(),
    student_data: z.object({
        social_profile: z.string().optional(), // 'single' или 'relationship'
    }).optional(),
});

export async function GET(req: NextRequest) {
    // извлекаем init data из заголова (фронт добавляет при запросе)
    const initData = req.headers.get('x-telegram-init-data')
    if (!initData) {
        return NextResponse.json({ erro: 'Missing initData'}, { status: 401});
    }

    // проверяем подпись

    const validationResult = await validateTelegramWebAppData(initData);
    if (!validationResult.valid || !validationResult.user) {
        return NextResponse.json({error: "Invalid initData"}, {status: 401});
    }

    const userId = validationResult.user.id;

     try {
    //  проксируем запрос к n8n webhook, передавая telegram_id
    const n8nResponse = await fetch(`${process.env.N8N_WEBHOOK_URL}/pwa/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_id: userId }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n responded with ${n8nResponse.status}`);
    }

    const data = await n8nResponse.json();

    //  валидация ответа от n8n перед отправкой клиенту
    const parsed = ProfileResponseSchema.safeParse(data);
    if (!parsed.success) {
      console.error('n8n response validation failed', parsed.error);
      return NextResponse.json({ error: 'Invalid data from backend' }, { status: 502 });
    }

    //  Отдаём клиенту
    return NextResponse.json(parsed.data);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
        

