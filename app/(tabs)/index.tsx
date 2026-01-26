import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { OrbMap } from '../../components/OrbMap';
import { OrbSheet } from '../../components/OrbSheet';
import { Partner } from '../../constants/MockData';

export default function MapScreen() {
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  return (
    <View style={styles.container}>
      <OrbMap 
        onSelectPartner={setSelectedPartner} 
        selectedId={selectedPartner?.id || null} 
      />
      {selectedPartner && (
        <OrbSheet 
          partner={selectedPartner} 
          onClose={() => setSelectedPartner(null)} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});
