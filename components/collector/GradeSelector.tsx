import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DT } from '@/constants/designTokens';

const { C, T, R } = { C: DT.colors, T: DT.type, R: DT.radius };

const GRADES = ['A', 'B', 'C', 'Reject'] as const;
export type Grade = typeof GRADES[number];

interface GradeSelectorProps {
  selected: Grade | null;
  onSelect: (grade: Grade) => void;
}

export default function GradeSelector({ selected, onSelect }: GradeSelectorProps) {
  return (
    <View style={styles.container}>
      {GRADES.map((grade) => {
        const isSelected = selected === grade;
        return (
          <TouchableOpacity
            key={grade}
            style={[styles.option, isSelected ? styles.optionSelected : styles.optionUnselected]}
            onPress={() => onSelect(grade)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.label, isSelected ? styles.labelSelected : styles.labelUnselected]}>
              {grade}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: R.sm, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  optionSelected: { backgroundColor: C.black, borderColor: C.black },
  optionUnselected: { backgroundColor: C.white, borderColor: C.border },
  label: { fontSize: T.md, fontWeight: T.semibold },
  labelSelected: { color: C.white },
  labelUnselected: { color: C.textPrimary },
});
