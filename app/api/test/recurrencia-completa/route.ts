import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { computeNextDate } from "@/app/lib/utils/cuestionarios";

export async function POST(req: NextRequest) {
  console.log('🧪 TESTING COMPLETE RECURRENCE SYSTEM...\n');
  
  const results = {
    triggerTest: null,
    scheduledSendsTest: null,
    processTest: null,
    finalStatus: null
  };
  
  try {
    // 1. TEST TRIGGER FUNCTIONALITY
    console.log('🔧 Step 1: Testing database trigger...');
    
    const { data: testRecord } = await supabaseAdmin
      .from('envios_programados')
      .select('id, actualizado_en')
      .limit(1)
      .single();
    
    if (!testRecord) {
      results.triggerTest = { success: false, error: 'No test record found' };
    } else {
      const originalTime = testRecord.actualizado_en;
      
      // Try to update a field to trigger the timestamp update
      const { data: updatedRecord, error: updateError } = await supabaseAdmin
        .from('envios_programados')
        .update({ canal: 'email' }) // Safe update
        .eq('id', testRecord.id)
        .select('id, actualizado_en')
        .single();
      
      if (updateError) {
        results.triggerTest = { 
          success: false, 
          error: updateError.message,
          details: 'Trigger still broken - needs SQL fix'
        };
      } else {
        const newTime = updatedRecord.actualizado_en;
        const triggerWorked = newTime !== originalTime;
        
        results.triggerTest = {
          success: triggerWorked,
          originalTime,
          newTime,
          details: triggerWorked ? 'Trigger working!' : 'Trigger not updating timestamp'
        };
      }
    }
    
    // 2. TEST SCHEDULED SENDS CREATION
    console.log('\n📅 Step 2: Testing scheduled sends creation...');
    
    const testPatientId = '20856aa1-f69f-414a-943a-17989809e12b'; // Nicolas Bagattini
    const testQuestionnaireId = '6630e0b4-9ae2-4f0d-932c-e649dadead81'; // WHO-5
    
    // Create a test scheduled send
    const testSend = {
      paciente_id: testPatientId,
      cuestionario_id: testQuestionnaireId,
      frecuencia: 'semanal',
      proximo_envio: new Date(Date.now() - 1000 * 60).toISOString(), // 1 minute ago (due)
      canal: 'email',
      activo: true
    };
    
    const { data: createdSend, error: createError } = await supabaseAdmin
      .from('envios_programados')
      .insert(testSend)
      .select('*')
      .single();
    
    if (createError) {
      results.scheduledSendsTest = { success: false, error: createError.message };
    } else {
      results.scheduledSendsTest = { 
        success: true, 
        createdId: createdSend.id,
        details: 'Test scheduled send created successfully'
      };
    }
    
    // 3. TEST PROCESSING ENDPOINT
    console.log('\n🚀 Step 3: Testing process endpoint...');
    
    const processResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/envios_programados/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!processResponse.ok) {
      results.processTest = { 
        success: false, 
        error: `HTTP ${processResponse.status}: ${await processResponse.text()}`
      };
    } else {
      const processData = await processResponse.json();
      results.processTest = { 
        success: true, 
        processed: processData.processed,
        details: 'Process endpoint working correctly'
      };
    }
    
    // 4. VERIFY UPDATES WERE APPLIED (if trigger is fixed)
    if (results.triggerTest?.success && createdSend) {
      console.log('\n🔍 Step 4: Verifying updates were applied...');
      
      const { data: updatedSend } = await supabaseAdmin
        .from('envios_programados')
        .select('*')
        .eq('id', createdSend.id)
        .single();
      
      if (updatedSend) {
        const wasUpdated = updatedSend.actualizado_en !== createdSend.actualizado_en;
        const nextDate = updatedSend.proximo_envio;
        const isActive = updatedSend.activo;
        
        results.finalStatus = {
          triggerWorking: wasUpdated,
          nextScheduled: nextDate,
          stillActive: isActive,
          details: wasUpdated ? 'Full recurrence system working!' : 'Sends work but scheduling not updating'
        };
      }
    }
    
    // 5. CLEANUP TEST DATA
    if (createdSend) {
      await supabaseAdmin
        .from('envios_programados')
        .delete()
        .eq('id', createdSend.id);
      console.log('🧹 Test data cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Exception in testing:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
  
  // FINAL ASSESSMENT
  const allWorking = results.triggerTest?.success && 
                     results.scheduledSendsTest?.success && 
                     results.processTest?.success &&
                     results.finalStatus?.triggerWorking;
  
  return NextResponse.json({
    success: true,
    systemStatus: allWorking ? 'FULLY_FUNCTIONAL' : 'PARTIAL_FUNCTIONALITY',
    results,
    recommendations: allWorking ? 
      ['✅ System is 100% functional!', '🚀 Ready for Edge Function deployment'] :
      ['⚠️ Apply SQL trigger fix in Supabase Dashboard', '🔄 Re-run this test after fix']
  });
}
