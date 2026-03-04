import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { encryptResponse } from '@/lib/responseEncryption';

interface Params {
  customerNumber: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { customerNumber } = await params;

    const sql = `
      SELECT 
        P_ADDRESS1 as city,
        P_ADDRESS2 as subcity,
        P_ADDRESS1 as woreda,
        P_ADDRESS4 as house_number,
        MOBILE_NUMBER as telephone 
      FROM FCUBSPRD.sttm_cust_personal 
      WHERE CUSTOMER_NO = :customerNumber
    `;

    const result = await executeQuery(sql, [customerNumber]);

    console.log('Query Result:', result);

    if (!result.success || !result.data || result.data.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: result.error || 'Customer address not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      encrypted: encryptResponse(result.data[0])
    });

  } catch (error) {
    console.error('Error fetching customer address:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Error fetching customer address' 
      },
      { status: 500 }
    );
  }
}