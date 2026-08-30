import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
} from "react-native";
import {
  UserRound,
  AtSign,
  AlignLeft,
} from "lucide-react-native";
import { ThemedText } from "@/components/themed-text";

type ProfileFormProps = {
  initialName?: string;
  initialUsername?: string;
  initialBio?: string;
  onChange?: (data: {
    name: string;
    username: string;
    bio: string;
  }) => void;
};

export default function ProfileForm({
  initialName = "บุคคลที่ชอบกิน",
  initialUsername = "@mookmhee",
  initialBio = "กินเก่ง ทำอาหารกินเองบ่อย 🔍✨",
  onChange,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);

  const handleNameChange = (value: string) => {
    setName(value);

    onChange?.({
      name: value,
      username,
      bio,
    });
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);

    onChange?.({
      name,
      username: value,
      bio,
    });
  };

  const handleBioChange = (value: string) => {
    setBio(value);

    onChange?.({
      name,
      username,
      bio: value,
    });
  };

  return (
    <View style={styles.container}>
      {/* Display Name */}
      <View style={styles.fieldContainer}>
        <ThemedText style={styles.label}>
          ชื่อที่แสดง
        </ThemedText>

        <View style={styles.inputWrapper}>
          <UserRound
            size={17}
            color="#8B716D"
            strokeWidth={1.7}
          />

          <TextInput
            value={name}
            onChangeText={handleNameChange}
            style={styles.input}
            placeholder="ชื่อที่แสดง"
            placeholderTextColor="#A9A09D"
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Username */}
      <View style={styles.fieldContainer}>
        <ThemedText style={styles.label}>
          ชื่อผู้ใช้
        </ThemedText>

        <View style={styles.inputWrapper}>
          <AtSign
            size={17}
            color="#8B716D"
            strokeWidth={1.7}
          />

          <TextInput
            value={username}
            onChangeText={handleUsernameChange}
            style={styles.input}
            placeholder="@username"
            placeholderTextColor="#241917"
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Bio */}
      <View style={styles.fieldContainer}>
        <ThemedText style={styles.label}>
          คำอธิบายตัวเอง
        </ThemedText>

        <View style={styles.inputWrapper}>
          <AlignLeft
            size={17}
            color="#8B716D"
            strokeWidth={1.7}
          />

          <TextInput
            value={bio}
            onChangeText={handleBioChange}
            style={styles.input}
            placeholder="บอกเกี่ยวกับตัวคุณ"
            placeholderTextColor="#241917"
            autoCapitalize="sentences"
            numberOfLines={1}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  fieldContainer: {
    marginBottom: 13,
    marginLeft: 5,
    marginRight: 5,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#57423E",
    marginBottom: 10,
    marginLeft: 2,
  },

  inputWrapper: {
    height: 50,
    borderWidth: 1,
    borderColor: "#9A9A9A",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  input: {
    flex: 1,
    height: "100%",
    marginLeft: 7,
    paddingVertical: 0,
    fontSize: 15,
    color: "#241917",
    fontFamily: "NotoSansThai_400Regular",
  },
});