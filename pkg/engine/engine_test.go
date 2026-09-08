package engine

import (
	"context"
	"encoding/binary"
	"testing"
	"voicestudio/pkg/models"
)

func TestWAVMathematicalCorrectness(t *testing.T) {
	ctx := context.Background()
	engine, err := NewStudioVoiceEngine(ctx)
	if err != nil {
		t.Fatalf("failed to create engine: %v", err)
	}

	voice := &models.VoiceProfile{
		ID:           "voice-padre-x",
		ProjectID:    models.ProjectNuestraParroquia,
		Name:         "Padre X",
		IsAuthorized: true,
	}

	// Test 16-bit Mono, 16-bit Stereo, 24-bit Mono, 24-bit Stereo, 32-bit Float Stereo
	formats := []struct {
		sampleRate int
		bitDepth   int
		channels   int
	}{
		{24000, 16, 1},
		{44100, 16, 2},
		{48000, 24, 1},
		{48000, 24, 2},
		{44100, 32, 2},
	}

	for _, fmtStruct := range formats {
		profile := StudioProfileConfig{}
		profile.Hardware.SampleRate = fmtStruct.sampleRate
		profile.Hardware.BitDepth = fmtStruct.bitDepth
		profile.Hardware.Channels = fmtStruct.channels
		engine.UpdateProfile(profile)

		data, _, err := engine.Synthesize(ctx, voice, "Test payload correctness", models.FormatWAV)
		if err != nil {
			t.Errorf("failed synthesize for %+v: %v", fmtStruct, err)
			continue
		}

		if len(data) < 44 {
			t.Errorf("invalid wav size: %d", len(data))
			continue
		}

		riff := string(data[0:4])
		wave := string(data[8:12])
		if riff != "RIFF" || wave != "WAVE" {
			t.Errorf("invalid header identifiers: %s, %s", riff, wave)
		}

		channelsParsed := int(binary.LittleEndian.Uint16(data[22:24]))
		sampleRateParsed := int(binary.LittleEndian.Uint32(data[24:28]))
		byteRateParsed := int(binary.LittleEndian.Uint32(data[28:32]))
		blockAlignParsed := int(binary.LittleEndian.Uint16(data[32:34]))
		bitDepthParsed := int(binary.LittleEndian.Uint16(data[34:36]))
		dataSizeParsed := int(binary.LittleEndian.Uint32(data[40:44]))

		expectedBlockAlign := fmtStruct.channels * (fmtStruct.bitDepth / 8)
		expectedByteRate := fmtStruct.sampleRate * expectedBlockAlign
		expectedDataSize := len(data) - 44

		if channelsParsed != fmtStruct.channels {
			t.Errorf("channels mismatch: expected %d, got %d", fmtStruct.channels, channelsParsed)
		}
		if sampleRateParsed != fmtStruct.sampleRate {
			t.Errorf("sampleRate mismatch: expected %d, got %d", fmtStruct.sampleRate, sampleRateParsed)
		}
		if bitDepthParsed != fmtStruct.bitDepth {
			t.Errorf("bitDepth mismatch: expected %d, got %d", fmtStruct.bitDepth, bitDepthParsed)
		}
		if blockAlignParsed != expectedBlockAlign {
			t.Errorf("blockAlign mismatch: expected %d, got %d", expectedBlockAlign, blockAlignParsed)
		}
		if byteRateParsed != expectedByteRate {
			t.Errorf("byteRate mismatch: expected %d, got %d", expectedByteRate, byteRateParsed)
		}
		if dataSizeParsed != expectedDataSize {
			t.Errorf("dataSize mismatch: header claims %d, physical buffer has %d", dataSizeParsed, expectedDataSize)
		}
	}
}