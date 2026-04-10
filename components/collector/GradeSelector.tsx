import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Design system colors
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const BORDER = '#E5E5E5';
const TEXT_PRIMARY = '#111111';

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
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: {
    backgroundColor: BLACK,
    borderColor: BLACK,
  },
  optionUnselected: {
    backgroundColor: WHITE,
    borderColor: BORDER,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelSelected: {
    color: WHITE,
  },
  labelUnselected: {
    color: TEXT_PRIMARY,
  },
});
