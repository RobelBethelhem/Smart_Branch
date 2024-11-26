import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    const query = `SELECT * FROM ACTB_DAILY_LOG WHERE TRN_REF_NO = :1`;
    const params = ['108PORE2318201JL'];
    
    const result = await executeQuery(query, params);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        message: 'Successfully connected to FLEXCUBE'
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: `Failed to connect to FLEXCUBE: ${error.message}`
    }, { status: 500 });
  }
}