import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  marketplaceService,
  ListingCategory,
  ItemCondition,
} from '../services/marketplace.service';

const CATEGORIES = [
  { value: ListingCategory.MARKER, label: 'Marker' },
  { value: ListingCategory.MASK, label: 'Mask' },
  { value: ListingCategory.TANK, label: 'Tank' },
  { value: ListingCategory.LOADER, label: 'Loader' },
  { value: ListingCategory.APPAREL, label: 'Apparel' },
  { value: ListingCategory.ACCESSORY, label: 'Accessory' },
  { value: ListingCategory.COMPLETE_SETUP, label: 'Complete Setup' },
  { value: ListingCategory.PAINT, label: 'Paint' },
  { value: ListingCategory.PARTS, label: 'Parts' },
];

const CONDITIONS = [
  { value: ItemCondition.NEW, label: 'New' },
  { value: ItemCondition.LIKE_NEW, label: 'Like New' },
  { value: ItemCondition.EXCELLENT, label: 'Excellent' },
  { value: ItemCondition.GOOD, label: 'Good' },
  { value: ItemCondition.FAIR, label: 'Fair' },
  { value: ItemCondition.PARTS, label: 'Parts/Not Working' },
];

export default function CreateListingScreen({ navigation, route }: any) {
  const gearItem = route?.params?.gearItem;
  const [loading, setLoading] = useState(false);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [webImageUrl, setWebImageUrl] = useState('');

  // Form state
  const [title, setTitle] = useState(gearItem ? `${gearItem.manufacturer || ''} ${gearItem.model || gearItem.name}`.trim() : '');
  const [description, setDescription] = useState(gearItem ? `${gearItem.name} from my PBGearbag. ${gearItem.notes || 'Add condition details and what is included.'}` : '');
  const [category, setCategory] = useState<ListingCategory>(ListingCategory.MARKER);
  const [brand, setBrand] = useState(gearItem?.manufacturer || '');
  const [model, setModel] = useState(gearItem?.model || '');
  const [condition, setCondition] = useState<ItemCondition>((gearItem?.condition as ItemCondition) || ItemCondition.EXCELLENT);
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [acceptsTrades, setAcceptsTrades] = useState(false);
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [country, setCountry] = useState('');
  const [shippingAvailable, setShippingAvailable] = useState(true);
  const [localPickup, setLocalPickup] = useState(true);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - imageUris.length,
    });

    if (!result.canceled) {
      const newUris = result.assets.map((asset) => asset.uri);
      setImageUris([...imageUris, ...newUris]);
    }
  };

  const removeImage = (index: number) => {
    setImageUris(imageUris.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!price.trim() || isNaN(parseFloat(price))) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    if (imageUris.length === 0 && !webImageUrl.trim()) {
      Alert.alert('Error', 'Please add at least one image');
      return;
    }

    setLoading(true);

    try {
      // Upload images first
      const uploadedImageUrls = imageUris.length > 0
        ? await marketplaceService.uploadImages(imageUris)
        : [webImageUrl.trim()];

      // Create listing
      const listingData = {
        title: title.trim(),
        description: description.trim(),
        category,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        condition,
        price: parseFloat(price),
        originalPrice: originalPrice.trim()
          ? parseFloat(originalPrice)
          : undefined,
        isNegotiable,
        acceptsTrades,
        images: uploadedImageUrls,
        city: city.trim() || undefined,
        stateProvince: stateProvince.trim() || undefined,
        country: country.trim() || undefined,
        shippingAvailable,
        localPickup,
      };

      const listing = await marketplaceService.createListing(listingData);

      Alert.alert('Success', 'Listing created successfully!');
      navigation.replace('ListingDetail', { listingId: listing.id });
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error?.message || error.response?.data?.message || 'Failed to create listing',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos *</Text>
          <Text style={styles.helperText}>Add up to 10 photos</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {imageUris.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}

            {imageUris.length < 10 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={pickImages}
              >
                <Text style={styles.addImageText}>+</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          {Platform.OS === 'web' && (
            <TextInput
              style={[styles.input, { marginTop: 12 }]}
              value={webImageUrl}
              onChangeText={setWebImageUrl}
              placeholder="Or paste an image URL for browser testing"
              placeholderTextColor="#666"
              autoCapitalize="none"
            />
          )}
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Planet Eclipse CS2 Pro - Like New"
            placeholderTextColor="#666"
            maxLength={200}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the item, its condition, what's included..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.chipContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.chip,
                  category === cat.value && styles.chipSelected,
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    category === cat.value && styles.chipTextSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Brand & Model */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Brand</Text>
            <TextInput
              style={styles.input}
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g., Planet Eclipse"
              placeholderTextColor="#666"
            />
          </View>

          <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Model</Text>
            <TextInput
              style={styles.input}
              value={model}
              onChangeText={setModel}
              placeholder="e.g., CS2 Pro"
              placeholderTextColor="#666"
            />
          </View>
        </View>

        {/* Condition */}
        <View style={styles.section}>
          <Text style={styles.label}>Condition *</Text>
          <View style={styles.chipContainer}>
            {CONDITIONS.map((cond) => (
              <TouchableOpacity
                key={cond.value}
                style={[
                  styles.chip,
                  condition === cond.value && styles.chipSelected,
                ]}
                onPress={() => setCondition(cond.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    condition === cond.value && styles.chipTextSelected,
                  ]}
                >
                  {cond.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Price *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Original Price</Text>
            <TextInput
              style={styles.input}
              value={originalPrice}
              onChangeText={setOriginalPrice}
              placeholder="Optional"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Options */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsNegotiable(!isNegotiable)}
          >
            <View style={styles.checkbox}>
              {isNegotiable && <View style={styles.checkboxChecked} />}
            </View>
            <Text style={styles.checkboxLabel}>Price is negotiable (OBO)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAcceptsTrades(!acceptsTrades)}
          >
            <View style={styles.checkbox}>
              {acceptsTrades && <View style={styles.checkboxChecked} />}
            </View>
            <Text style={styles.checkboxLabel}>Open to trades</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setShippingAvailable(!shippingAvailable)}
          >
            <View style={styles.checkbox}>
              {shippingAvailable && <View style={styles.checkboxChecked} />}
            </View>
            <Text style={styles.checkboxLabel}>Shipping available</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setLocalPickup(!localPickup)}
          >
            <View style={styles.checkbox}>
              {localPickup && <View style={styles.checkboxChecked} />}
            </View>
            <Text style={styles.checkboxLabel}>Local pickup available</Text>
          </TouchableOpacity>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Enter city"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>State/Province</Text>
          <TextInput
            style={styles.input}
            value={stateProvince}
            onChangeText={setStateProvince}
            placeholder="Enter state or province"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholder="Enter country"
            placeholderTextColor="#666"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Listing</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101516',
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    marginTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#283033',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#283033',
  },
  addImageText: {
    fontSize: 32,
    color: '#666',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#283033',
    borderWidth: 1,
    borderColor: '#333',
  },
  chipSelected: {
    backgroundColor: '#D39A3A',
    borderColor: '#D39A3A',
  },
  chipText: {
    color: '#ccc',
    fontSize: 14,
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D39A3A',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#D39A3A',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#ccc',
  },
  submitButton: {
    backgroundColor: '#D39A3A',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#666',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
