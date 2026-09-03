import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Option {
  id: string;
  label: string;
}

interface MultiSelectDropdownProps {
  options: Option[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  placeholder?: string;
}

export function MultiSelectDropdown({
  options,
  selectedIds,
  onSelectionChange,
  placeholder = 'เลือกประเภทอาหาร',
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(item => item !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const getDisplayText = () => {
    if (selectedIds.length === 0) return placeholder;
    return options
      .filter(opt => selectedIds.includes(opt.id))
      .map(opt => opt.label)
      .join(', ');
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.dropdownButton, isOpen && styles.dropdownButtonOpen]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.dropdownText} numberOfLines={1}>
          {getDisplayText()}
        </Text>
        <Feather name={isOpen ? 'chevron-up' : 'chevron-down'} size={24} color="#9F9F9F" />
      </Pressable>

      {isOpen && (
        <View style={styles.dropdownList}>
          <ScrollView style={styles.scrollList} nestedScrollEnabled showsVerticalScrollIndicator={true}>
            {options.map((option) => {
              const isSelected = selectedIds.includes(option.id);
              return (
                <Pressable
                  key={option.id}
                  style={styles.optionRow}
                  onPress={() => toggleOption(option.id)}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Feather name="check" size={16} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.optionText}>{option.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    zIndex: 10,
    elevation: 10,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#7A8B99',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownButtonOpen: {
    // Optionally style when open
  },
  dropdownText: {
    fontSize: 16,
    color: '#5A4A42',
    fontFamily: 'NotoSansThai_600SemiBold',
    flex: 1,
    marginRight: 8,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#7A8B99',
    borderRadius: 12,
    paddingVertical: 8,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  scrollList: {
    maxHeight: 240,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#5A4A42',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#5A4A42',
    borderColor: '#5A4A42',
  },
  optionText: {
    fontSize: 16,
    color: '#5A4A42',
    fontFamily: 'NotoSansThai_600SemiBold',
  },
});
