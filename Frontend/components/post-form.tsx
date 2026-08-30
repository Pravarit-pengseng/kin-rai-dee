import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import {
  Utensils,
  MessageSquareText,
  MapPin,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react-native";

import { ThemedText } from "@/components/themed-text";

const categories = [
  "อาหารจานเดียว",
  "กับข้าว",
  "อาหารเล่น",
  "ของว่าง",
];

export type PostData = {
  image: string | null;
  title: string;
  description: string;
  restaurant: string;
  categories: string[];
};

type PostFormProps = {
  initialData?: PostData;
  onChange?: (data: PostData) => void;
};

type InputFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  icon: React.ReactNode;
  onChangeText: (text: string) => void;
};

function InputField({
  label,
  value,
  placeholder,
  icon,
  onChangeText,
}: InputFieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <ThemedText style={styles.label}>
          {label}
        </ThemedText>

        <ThemedText style={styles.counter}>
          ({value.length}/45)
        </ThemedText>
      </View>

      <View style={styles.inputWrapper}>
        {icon}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A9A09D"
          style={styles.input}
          autoCapitalize="none"
          multiline={false}
          numberOfLines={1}
          maxLength={45}
          returnKeyType="done"
        />
      </View>
    </View>
  );
}

export default function PostForm({
  initialData,
  onChange,
}: PostFormProps) {
  const [post, setPost] = useState<PostData>(
    initialData ?? {
      image: null,
      title: "",
      description: "",
      restaurant: "",
      categories: ["อาหารจานเดียว"],
    }
  );

  const [open, setOpen] = useState(false);

  /*
   * Load existing post data when EditPost opens.
   */
  useEffect(() => {
    if (!initialData) {
      return;
    }

    setPost(initialData);
  }, [initialData]);

  const updatePost = (data: Partial<PostData>) => {
    const newPost = {
      ...post,
      ...data,
    };

    setPost(newPost);
    onChange?.(newPost);
  };

  const toggleCategory = (item: string) => {
    const selected = post.categories.includes(item)
      ? post.categories.filter(
          (category) => category !== item
        )
      : [...post.categories, item];

    updatePost({
      categories: selected,
    });
  };

  return (
    <View style={styles.container}>
      {/* Menu Name */}
      <InputField
        label="ชื่อเมนู"
        value={post.title}
        placeholder="เช่น ข้าวกะเพราไข่ดาว"
        onChangeText={(text) =>
          updatePost({
            title: text,
          })
        }
        icon={
          <Utensils
            size={17}
            color="#8B716D"
            strokeWidth={1.7}
          />
        }
      />

      {/* Description */}
      <InputField
        label="เล่าความอร่อย"
        value={post.description}
        placeholder="รสชาติเป็นยังไงบ้าง? บรรยากาศร้านดีไหม?..."
        onChangeText={(text) =>
          updatePost({
            description: text,
          })
        }
        icon={
          <MessageSquareText
            size={17}
            color="#8B716D"
            strokeWidth={1.7}
          />
        }
      />

      {/* Restaurant */}
      <InputField
        label="ลิงก์ร้านอาหาร"
        value={post.restaurant}
        placeholder="บอกชื่อพิกัดร้านอาหาร"
        onChangeText={(text) =>
          updatePost({
            restaurant: text,
          })
        }
        icon={
          <MapPin
            size={17}
            color="#8B716D"
            strokeWidth={1.7}
          />
        }
      />

      {/* Category */}
      <View style={styles.field}>
        <ThemedText style={styles.label}>
          ประเภทอาหาร
        </ThemedText>

        <Pressable
          onPress={() => setOpen((prev) => !prev)}
          style={styles.dropdown}
        >
          <ThemedText
            style={styles.dropdownText}
            numberOfLines={1}
          >
            {post.categories.length > 0
              ? post.categories.join(", ")
              : "เลือกประเภทอาหาร"}
          </ThemedText>

          {open ? (
            <ChevronUp
              size={19}
              color="#80635C"
            />
          ) : (
            <ChevronDown
              size={19}
              color="#80635C"
            />
          )}
        </Pressable>

        {open && (
          <View style={styles.options}>
            {categories.map((item) => {
              const checked =
                post.categories.includes(item);

              return (
                <Pressable
                  key={item}
                  onPress={() =>
                    toggleCategory(item)
                  }
                  style={styles.option}
                >
                  <View
                    style={[
                      styles.checkbox,
                      checked && styles.checked,
                    ]}
                  >
                    {checked && (
                      <Check
                        size={14}
                        color="#FFFFFF"
                      />
                    )}
                  </View>

                  <ThemedText
                    style={styles.optionText}
                  >
                    {item}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  field: {
    marginBottom: 13,
    marginLeft: 5,
    marginRight: 5,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#57423E",
    marginLeft: 2,
  },

  counter: {
    fontSize: 13,
    color: "#8B716D",
    marginRight: 2,
  },

  inputWrapper: {
    height: 50,
    borderWidth: 1,
    borderColor: "#8B716D",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    overflow: "hidden",
  },

  input: {
    flex: 1,
    height: 48,
    marginLeft: 7,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontSize: 15,
    color: "#241917",
    fontFamily: "NotoSansThai_400Regular",
  },

  dropdown: {
    height: 50,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#8B716D",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownText: {
    flex: 1,
    fontSize: 15,
    color: "#241917",
    fontFamily: "NotoSansThai_400Regular",
    marginRight: 8,
  },

  options: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#8B716D",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  option: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  checkbox: {
    width: 19,
    height: 19,
    borderWidth: 1,
    borderColor: "#806E68",
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  checked: {
    backgroundColor: "#604E49",
    borderColor: "#604E49",
  },

  optionText: {
    fontSize: 14,
    color: "#604E49",
    fontFamily: "NotoSansThai_400Regular",
  },
});